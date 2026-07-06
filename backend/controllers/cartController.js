import User from '../models/User.js';
import Product from '../models/productModel.js';
import StockReservation from '../models/StockReservation.js';

const DEFAULT_CART_SIZE_KEY = 'default';

// Add products to user cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId, size = DEFAULT_CART_SIZE_KEY, quantity = 1 } = req.body;
    const requestedQuantity = Number(quantity);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found' });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartData = userData.cartData || {};
    const currentQuantity = cartData[itemId]?.[size] || 0;
    const newQuantity = currentQuantity + requestedQuantity;

    const reservedQuantity = await StockReservation.aggregate([
      { $match: { productId: product._id, size: size } },
      { $group: { _id: null, totalReserved: { $sum: '$quantity' } } }
    ]);
    const totalReserved = reservedQuantity.length > 0 ? reservedQuantity[0].totalReserved : 0;
    const availableStock = product.quantity - totalReserved;

    const userReservations = await StockReservation.find({
      productId: itemId,
      size,
      userId
    });
    const userReservedCount = userReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
    const netAvailable = availableStock + userReservedCount;

    if (newQuantity > netAvailable) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    const quantityDiff = newQuantity - currentQuantity;
    if (quantityDiff > 0) {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      for (let i = 0; i < quantityDiff; i += 1) {
        const reservation = new StockReservation({
          productId: itemId,
          size,
          userId,
          quantity: 1,
          expiresAt
        });
        await reservation.save();
      }
    }

    const updatedCartItem = { ...(cartData[itemId] || {}), [size]: newQuantity };
    cartData[itemId] = updatedCartItem;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { cartData },
      { new: true }
    );

    return res.json({ success: true, message: 'Added to cart', cartData: updatedUser.cartData || {} });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update user cart
const updateCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId, size = DEFAULT_CART_SIZE_KEY, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found' });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    if (!Number.isFinite(requestedQuantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a number' });
    }

    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartData = userData.cartData || {};
    const currentQuantity = cartData[itemId]?.[size] || 0;

    if (requestedQuantity <= 0) {
      await StockReservation.deleteMany({
        productId: itemId,
        size,
        userId
      });

      if (cartData[itemId]) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      const quantityDiff = requestedQuantity - currentQuantity;

      if (quantityDiff > 0) {
        const reservedQuantity = await StockReservation.aggregate([
          { $match: { productId: product._id, size } },
          { $group: { _id: null, totalReserved: { $sum: '$quantity' } } }
        ]);
        const totalReserved = reservedQuantity.length > 0 ? reservedQuantity[0].totalReserved : 0;
        const availableStock = product.quantity - totalReserved;

        const userReservations = await StockReservation.find({
          productId: itemId,
          size,
          userId
        });
        const userReservedCount = userReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
        const netAvailable = availableStock + userReservedCount;

        if (requestedQuantity > netAvailable) {
          return res.status(400).json({ success: false, message: 'Not enough stock available' });
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        for (let i = 0; i < quantityDiff; i += 1) {
          const reservation = new StockReservation({
            productId: itemId,
            size,
            userId,
            quantity: 1,
            expiresAt
          });
          await reservation.save();
        }
      } else if (quantityDiff < 0) {
        const excessToRemove = Math.abs(quantityDiff);
        const userReservations = await StockReservation.find({
          productId: itemId,
          size,
          userId
        }).sort({ reservedAt: -1 });

        let removed = 0;
        for (const reservation of userReservations) {
          if (removed >= excessToRemove) break;
          const toRemove = Math.min(reservation.quantity, excessToRemove - removed);
          if (toRemove === reservation.quantity) {
            await StockReservation.findByIdAndDelete(reservation._id);
          } else {
            reservation.quantity -= toRemove;
            await reservation.save();
          }
          removed += toRemove;
        }
      }

      cartData[itemId] = { ...(cartData[itemId] || {}), [size]: requestedQuantity };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { cartData },
      { new: true }
    );

    return res.json({ success: true, message: 'Cart Updated', cartData: updatedUser.cartData || {} });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get user cart data
const getUserCart = async (req, res) => {
  try {
    console.log('Get cart request - User from token:', req.user);
    
    const userId = req.user.userId; // Get userId from authenticated user
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      console.log('No userId found in request');
      return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    
    const userData = await User.findById(userId);
    console.log('Found user data:', userData ? 'Yes' : 'No');
    
    if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

    const cartData = userData.cartData || {};
    console.log('Retrieved cart data:', cartData);
    
    res.json({ success: true, cartData });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear user cart
const clearCart = async (req, res) => {
  try {
    console.log('Clear cart request - User from token:', req.user);
    
    const userId = req.user.userId; // Get userId from authenticated user
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      console.log('No userId found in request');
      return res.status(401).json({ success: false, message: 'User ID not found' });
    }

    const userData = await User.findById(userId);
    console.log('Found user data:', userData ? 'Yes' : 'No');
    
    if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { cartData: {} },
      { new: true } // Return the updated document
    );
    
    console.log('Database update result:', updatedUser ? 'Success' : 'Failed');
    
    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart, clearCart };