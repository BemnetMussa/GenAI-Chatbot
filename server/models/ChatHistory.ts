import mongoose, { Schema, Document } from 'mongoose';

// Interface for a single message
interface IMessage {
  content: string;
  sender: string;  // 'user' or 'assistant'
  timestamp: Date;
}

// Interface for the ChatHistory document
export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'assistant']  // Ensures sender can only be 'user' or 'assistant'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true   
  },
  messages: [messageSchema],
}, {
  timestamps: true 
});

// Create a compound index on userId and createdAt for efficient querying
chatHistorySchema.index({ userId: 1, createdAt: -1 });

const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);

export default ChatHistory;