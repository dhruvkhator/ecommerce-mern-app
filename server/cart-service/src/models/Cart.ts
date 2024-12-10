import mongoose, { Schema, Document } from 'mongoose';


export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    name: string;  // Product name at the time of adding to cart
    price: number; // Product price at the time of adding to cart
    quantity: number;
  }[];
}


const CartSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
      {
        product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
  },
  {
    timestamps: true,
  }
);


export default mongoose.model<ICart>('Cart', CartSchema, 'carts');
