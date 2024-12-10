import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    logoUrl?: string;
}

const BrandSchema: Schema = new Schema({
    name: { type: String, required: true },
    logoUrl: { type: String, default: null },
});

export default mongoose.model<IBrand>('Brand', BrandSchema, 'brands');