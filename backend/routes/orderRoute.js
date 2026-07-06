import express from 'express';
import { 
  getUserOrders, 
  getOrderDetails, 
  updateOrderStatus,
  placeOrder,
  getAllOrders,
  orderPaymentSuccess,
  orderPaymentFail,
  orderPaymentCancel,
  getOrderInvoice
} from '../controllers/orderController.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

// Get all orders route
orderRouter.get('/all', authUser, getAllOrders);

// User routes
orderRouter.post('/user', authUser, getUserOrders);
orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/cod', authUser, placeOrder);  // Backward compatibility

// Order details and status routes
orderRouter.get('/details/:orderId', authUser, getOrderDetails);
orderRouter.put('/status/:orderId', authUser, updateOrderStatus);

// Order payment routes
orderRouter.get('/payment/success/:orderId', orderPaymentSuccess);
orderRouter.post('/payment/success/:orderId', orderPaymentSuccess);
orderRouter.get('/payment/fail/:orderId', orderPaymentFail);
orderRouter.post('/payment/fail/:orderId', orderPaymentFail);
orderRouter.get('/payment/cancel/:orderId', orderPaymentCancel);
orderRouter.post('/payment/cancel/:orderId', orderPaymentCancel);

// Order invoice route
orderRouter.get('/invoice/:orderId', getOrderInvoice);

export default orderRouter; 