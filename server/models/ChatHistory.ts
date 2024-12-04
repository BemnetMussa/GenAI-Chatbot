import mongoose, { Schema, Document } from 'mongoose';

// Interface for a single message
interface IMessage {
  content: string;
  sender: string; // 'user' or 'assistant'
  timestamp: Date;
}

// Interface for a single conversation
interface IConversation {
  _id: mongoose.Types.ObjectId;  // Use ObjectId here
  messages: IMessage[];
}


// Interface for the ChatHistory document
export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  conversations: IConversation[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'assistant'], // Only 'user' or 'assistant' allowed
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new Schema({
  messages: [messageSchema], // Array of messages
});

const chatHistorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for efficient querying
    },
    conversations: [conversationSchema], // Array of conversations
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);

export default ChatHistory;
