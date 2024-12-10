import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    phone: string;
    products: {
        product: mongoose.Types.ObjectId;
        name: string;  // Product name at the time of order
        price: number; // Product price at the time of order
        quantity: number;
    }[];
    shippingAddress: {
        addressId: mongoose.Types.ObjectId;
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    totalPrice: number;
    status: string;
    jobId: string; //the expiration job that we run we need to store its id somewhere
}

const OrderSchema: Schema = new Schema(
    {
        user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        products: [
            {
                product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true, min: 1 }
            }
        ],
        shippingAddress: {
            addressId: { type: mongoose.Types.ObjectId, ref: 'Address', required: true },
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true }
        },
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: ['Pending', 'Processed' ,'Shipped', 'Delivered', 'Cancelled', 'Expired'],
            default: 'Pending'
        },
        jobId: {type: String, required: true}
    },
    { timestamps: true } // Automatically manage createdAt and updatedAt
);

export default mongoose.model<IOrder>('Order', OrderSchema, 'orders');
