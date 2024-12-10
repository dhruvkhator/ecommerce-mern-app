import mongoose, { Schema, Document } from 'mongoose';

// Interface for Inventory Document
export interface IInventory extends Document {
    productId: mongoose.Types.ObjectId;
    stock: number;
    lowStockThreshold: number; // For tracking low stock alerts
}

// Inventory Schema
const InventorySchema: Schema = new Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 10 }, // Default threshold to alert low stock
}, {
    timestamps: true // Automatically add createdAt and updatedAt timestamps
});

export default mongoose.model<IInventory>('Inventory', InventorySchema, 'inventory');
