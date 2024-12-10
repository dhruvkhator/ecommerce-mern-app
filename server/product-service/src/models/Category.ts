import mongoose, {Document, Schema} from "mongoose";

export interface ICategory extends Document{
    name: string;
    parentCategoryId?: mongoose.Types.ObjectId;
}

const CategorySchema: Schema = new Schema({
    name: {type: String, required: true},
    parentCategoryId: {type: Schema.Types.ObjectId, ref: 'Category', default: null}
})

export default mongoose.model<ICategory>('Category', CategorySchema, 'categories')



