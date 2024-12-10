import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
}



const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
}
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema, 'users');
