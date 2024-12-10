import mongoose, { Schema, Document, ObjectId} from "mongoose";

export interface IAddress extends Document {
    title: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    userId: ObjectId;
}

const AddressSchema = new Schema({
    title: { type: String, required: true},
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone:{type: String, required: true},
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
},
    {
        timestamps:true
    }
);

export default mongoose.model<IAddress>('Address', AddressSchema, 'addresses');

