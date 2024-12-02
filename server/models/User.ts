// src/models/User.ts
import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  googleId?: string; 
  name: string;
  email: string;
  password?: string; 
  picture?: string; 
}

const userSchema = new Schema<IUser>({
  googleId: {
    type: String,
    required: false, 
  },
  name: {
    type: String,
    required: true, 
  },
  email: {
    type: String,
    required: true, 
    unique: true,  
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password is required only if googleId is not provided
    },
  },
  picture: {
    type: String, 
  },
});

export default model<IUser>("User", userSchema);
