import orderModel from '../models/orderModel.js';
import User from '../models/User.js';
import productModel from '../models/productModel.js';
import StockReservation from '../models/StockReservation.js';
import { updateProductQuantity } from './productController.js';
import SSLCommerzPayment from "sslcommerz-lts";

// SSLCommerz configuration
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false; // false = sandbox

//global variables
const currency = 'BDT';
const delivery_fee = 50;
const placeOrder = async (req,res)=>{
    try {
        const {userId,items,amount,address,paymentMethod="COD"}=req.body;
        console.log("🔥 PAYMENT METHOD RECEIVED:", paymentMethod);
        
        // Validate required fields
        if (!userId || !items || !amount || !address) {
            return res.status(400).json({success:false,message:"Missing required fields"});
        }

        // Fetch product details and update quantities using reservations
        const productsWithDetails = await Promise.all(items.map(async (item) => {
            const product = await productModel.findById(item._id);
            if (!product) {
                throw new Error(`Product not found: ${item._id}`);
            }

            // Check and remove user reservations for this item/size
            const userReservations = await StockReservation.find({
                productId: item._id,
                size: item.size,
                userId: userId
            }).sort({ reservedAt: 1 }); // Remove oldest first

            let reservedCount = 0;
            for (const reservation of userReservations) {
                reservedCount += reservation.quantity;
            }

            if (reservedCount < item.quantity) {
                throw new Error(`Not enough reserved stock for ${product.name}. Reserved: ${reservedCount}, Requested: ${item.quantity}`);
            }

            // Remove reservations (up to the ordered quantity)
            let toRemove = item.quantity;
            for (const reservation of userReservations) {
                if (toRemove <= 0) break;
                const removeCount = Math.min(reservation.quantity, toRemove);
                if (removeCount === reservation.quantity) {
                    await StockReservation.findByIdAndDelete(reservation._id);
                } else {
                    reservation.quantity -= removeCount;
                    await reservation.save();
                }
                toRemove -= removeCount;
            }

            // Update product quantity
            const newQuantity = product.quantity - item.quantity;
            product.quantity = newQuantity;
            await product.save();

            return {
                productId: item._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                size: item.size
            };
        }));

        const orderData={
            userId,
            products: productsWithDetails,
            totalPrice: amount,
            shippingAddress: address,
            paymentMethod: paymentMethod,
          // For online payments (sslcommerz) we mark payment pending and wait for confirmation.
          // For Cash on Delivery (COD) we should NOT mark as paid immediately; mark as pending until collected.
          payment: false,
          paymentStatus: 'pending',
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // If online payment, initiate SSLCommerz
        if (paymentMethod === "sslcommerz") {
            console.log("🚀 Entering SSLCommerz block");
            const tran_id = `PETCARE_ORDER_${Date.now()}_${newOrder._id}`;

            const data = {
                total_amount: amount,
                currency: "BDT",
                tran_id: tran_id,
                success_url: `http://localhost:5003/api/order/payment/success/${newOrder._id}`,
                fail_url: `http://localhost:5003/api/order/payment/fail/${newOrder._id}`,
                cancel_url: `http://localhost:5003/api/order/payment/cancel/${newOrder._id}`,
                ipn_url: "http://localhost:5003/api/order/payment/ipn",
                shipping_method: "NO",
                product_name: "Pet Care Products",
                product_category: "E-commerce",
                product_profile: "general",
                cus_name: req.user?.name || "Customer",
                cus_email: req.user?.email || "customer@gmail.com",
                cus_add1: address,
                cus_city: "Dhaka",
                cus_country: "Bangladesh",
                cus_phone: "01700000000",
            };

            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
            const apiResponse = await sslcz.init(data);

            // Don't clear cart yet - wait for payment confirmation
            return res.json({
                success: true,
                message: "Order placed successfully, proceed to payment",
                order: newOrder,
                paymentUrl: apiResponse.GatewayPageURL
            });
        }

        // For COD, clear cart immediately
        await User.findByIdAndUpdate(userId,{cartData:{}});

        res.json({success:true,message:"Order placed successfully",order:newOrder});
    } catch (error) {
        console.log("Place order error:",error);
        res.status(500).json({success:false,message:error.message});
    }
};


// Get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find()
            .populate({
                path: 'userId',
                select: 'name email'
            })
            .sort({ createdAt: -1 });

        if (!orders) {
            return res.status(404).json({ 
                success: false, 
                message: 'No orders found' 
            });
        }

        const transformedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                _id: orderObj._id,
                userId: orderObj.userId,
                products: orderObj.products || [],
                totalPrice: orderObj.totalPrice,
                status: orderObj.status || 'Pending',
                date: orderObj.date || orderObj.createdAt,
                shippingAddress: orderObj.shippingAddress,
                paymentMethod: orderObj.paymentMethod
            };
        });

        res.status(200).json({
            success: true,
            orders: transformedOrders
        });
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders',
            error: error.message 
        });
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID not found' });
        }

        const orders = await orderModel.find({ userId })
            .populate('products.productId', 'name price image')
            .sort({ createdAt: -1 });
        
        // Transform the orders to include product details
        const transformedOrders = orders.map(order => ({
            ...order.toObject(),
            products: order.products.map(product => ({
                ...product,
                productId: product.productId?._id || product.productId,
                image: product.productId?.image?.[0] || null,
                name: product.productId?.name || product.name,
                price: product.productId?.price || product.price,
                quantity: product.quantity,
                size: product.size
            }))
        }));
        
        console.log('Transformed orders:', transformedOrders); // Debug log
        res.json({ success: true, orders: transformedOrders });
    } catch (error) {
        console.log("Get user orders error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findById(orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.log("Get order details error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await orderModel.findByIdAndUpdate(
            orderId,
      { status },
      { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // If the status was set to 'Payment Confirmed', update payment fields as well
        if (String(status).toLowerCase() === 'payment confirmed') {
          try {
            order.payment = true;
            order.paymentStatus = 'paid';
            await order.save();
          } catch (err) {
            console.error('Failed to update payment fields after status change:', err);
          }
        }

        res.json({ success: true, order });
    } catch (error) {
        console.log("Update order status error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get Order Invoice Data
const getOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Getting invoice for order:', orderId);

    const order = await orderModel.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    console.log('Found order:', order);

    // Fetch user details for invoice
    const user = await User.findById(order.userId);

    console.log('User:', user);

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      orderId: order._id,
      transactionId: order.transactionId || `PETCARE_ORD_${Date.now()}`,
      date: order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : new Date().toLocaleDateString(),
      time: order.paymentDate ? new Date(order.paymentDate).toLocaleTimeString() : new Date().toLocaleTimeString(),

      // Customer details
      customer: {
        name: user?.name || "Customer",
        email: user?.email || "customer@email.com",
        phone: user?.phoneNumber || "N/A",
        address: order.shippingAddress || "N/A",
      },

      // Product details
      products: order.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        size: p.size || "N/A",
        total: p.price * p.quantity
      })),

      // Order details
      order: {
        status: order.status,
        paymentMethod: order.paymentMethod,
        date: new Date(order.date).toLocaleDateString(),
      },

      // Payment details
      payment: {
        subtotal: order.totalPrice - 2,
        deliveryCharge: 50,
        total: order.totalPrice,
        currency: "BDT",
        status: order.paymentStatus === "paid" ? "Paid" : "Pending",
        method: order.paymentMethod === "sslcommerz" ? "SSLCommerz" : "Cash on Delivery",
      },

      // Company details
      company: {
        name: "FurEver Care Management System",
        address: "Dhaka, Bangladesh",
        phone: "+880 1700-000000",
        email: "support@furevercare.com",
      }
    };

    console.log('Generated invoice data:', invoiceData);

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error("Get order invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error: error.message
    });
  }
};


// Order Payment Success
const orderPaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "paid",
      payment: true,
      status: "Payment Confirmed",
      paymentDate: new Date()
    }, { new: true });

    if (!order) {
      return res.redirect("http://localhost:5174/order-payment-failed");
    }

    // Clear cart only after successful payment
    await User.findByIdAndUpdate(order.userId, { cartData: {} });

    res.redirect(`http://localhost:5174/order-payment-success?orderId=${orderId}`);

  } catch (error) {
    console.error("Order payment success error:", error);
    res.redirect("http://localhost:5174/order-payment-failed");
  }
};

// Order Payment Failed
const orderPaymentFail = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Mark order as failed but don't delete it
    await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "failed",
      status: "Cancelled"
    });

    // Cart is NOT cleared - user can retry
    res.redirect("http://localhost:5174/order-payment-failed");
  } catch (error) {
    console.error("Order payment fail error:", error);
    res.redirect("http://localhost:5174/order-payment-failed");
  }
};

// Order Payment Cancelled
const orderPaymentCancel = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Mark order as cancelled but keep it in records
    await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "cancelled",
      status: "Cancelled"
    });

    // Cart is NOT cleared - user can proceed with new order
    res.redirect("http://localhost:5174/order-payment-cancelled");
  } catch (error) {
    console.error("Order payment cancel error:", error);
    res.redirect("http://localhost:5174/order-payment-cancelled");
  }
};
export { getAllOrders, getUserOrders, getOrderDetails, updateOrderStatus, placeOrder, orderPaymentSuccess, orderPaymentFail, orderPaymentCancel, getOrderInvoice };
