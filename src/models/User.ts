import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
    name: string;
    email: string;
    password?: string;
    role: string;
    isVerified: boolean;
    verificationToken?: string;
}

const UserSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String }, // Hashed
        role: { type: String, enum: ["admin", "user"], default: "admin" },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
    },
    { timestamps: true }
);

if (mongoose.models.User) {
    mongoose.deleteModel("User");
}

export default mongoose.model<UserDocument>("User", UserSchema);
