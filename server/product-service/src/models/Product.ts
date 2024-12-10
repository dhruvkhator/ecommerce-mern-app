import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    category: mongoose.Types.ObjectId;
    brand: mongoose.Types.ObjectId;
    specifications: { key: string; value: string }[];
    images: string[];
    tags: string[];
    isFeatured: boolean;
    featuredImages: string[];
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    specifications: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true },
        },
    ],
    images: [{ type: String }],
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    featuredImages: [{ type: String }],
});

export default mongoose.model<IProduct>('Product', ProductSchema);