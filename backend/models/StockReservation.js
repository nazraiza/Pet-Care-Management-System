// Stock Reservation Model for temporary stock holding during checkout
import mongoose from "mongoose";

const stockReservationSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: 1 },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index for auto-deletion
});

const StockReservation = mongoose.models.StockReservation || mongoose.model("StockReservation", stockReservationSchema);

export default StockReservation;