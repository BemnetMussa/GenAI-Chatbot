
import cors from 'cors';
import { router as userRouter } from '../routes/userRoutes';
import connectDB from './db';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import User from '../models/User'; // Your User model
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import express, { Request, Response } from 'express';
import { Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import ChatHistory from '../models/ChatHistory';
import { LoginTicket } from 'google-auth-library';
import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { Navigate } from 'react-router-dom';



dotenv.config();
// Type definitions
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  picture?: string;
}


interface ChatMessage {
  _id: string;
  // Add other message properties as needed
}

interface ChatHistoryDocument {
  userId: string;
  conversations: ChatMessage[];
}


// IMessage interface
interface IMessage extends Document {
  content: string;
  sender: 'user' | 'assistant';   // Who sent the message ('user' or 'assistant')
  timestamp: Date;
}


interface IConversation {
  _id: mongoose.Types.ObjectId;  // Use ObjectId here
  messages: IMessage[];
}

// IChatHistory interface
export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;        // Reference to User's ObjectId
  conversations: IConversation[];          // Array of conversations (IConversation[])
  createdAt: Date;
  updatedAt: Date;
}





const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cookieParser()); 

// Session and passport setup
app.use(session({
  secret: process.env.ACCESS_TOKEN_SECRET || 'default' ,
  resave: false,
  saveUninitialized: true,
}));



// CORS setup
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
}));





// Configure Google Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "http://localhost:5000/google-auth/callback",
    scope: ["profile", "email"]
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          picture: profile.photos[0]?.value || 'https://via.placeholder.com/150'
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

app.use(passport.initialize());
app.use(passport.session());


// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});



// Connect to the database
try {
  connectDB();
} catch (error) {
  console.error('Error connecting to the database:', error);
  process.exit(1); 
}

// Routes
app.use('/api/users', userRouter); 

app.post('/auth', (req, res) => {
  res.status(200).json({ message: 'Authenticated successfully', user: req.user });
});



// Google Auth routes
app.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

app.get('/google-auth/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/signup',
    session: true
  }), async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;

      
      // Generate JWT token for Google-authenticated users
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET || 'default_secret',
      );

      // Set JWT cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Redirect to frontend with success
      res.redirect(`http://localhost:3000/`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);


// google authentication login


app.get('/google_login', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get(
  '/google_login/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  async (req:Request, res:Response) => {
    try {
      const googleUser = req.user as any;

      // Simulate a database check for the user
      const existingUser = await User.findOne({ googleId: googleUser.googleId });

      let user;

      if (existingUser) {
        // User already exists in the database
        user = existingUser;
      } else {
        // User doesn't exist, create a new one
        user = new User({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        });
        await user.save();
      }

      // Generate JWT for the user
      const token = jwt.sign(
        { id: user.googleId, email: user.email },
        process.env.ACCESS_TOKEN_SECRET || 'default_secret',
        { expiresIn: '1h' }
      );

      // Set JWT as a cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Redirect to frontend
      res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
    } catch (error) {
      console.error('Google Login Error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);



// Logout route
app.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('authToken');
  req.logout(() => {
    res.redirect('http://localhost:3000/login');
  });
});












app.post('/chat', async (req: Request, res: Response) => {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.gemini_API_ID);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { question: userPrompt, userId, messageId } = req.body;

  console.log('Received request:', { userPrompt, userId, messageId });

  if (!userPrompt || !userId || !messageId) {
    return res.status(400).json({ error: "Question, User ID, and Message ID are required" });
  }

  try {
    // Generate AI response
    const result = await model.generateContent(userPrompt);
    const assistantResponse = result.response.text();

    console.log('AI Response generated:', assistantResponse);

    // Find the user's chat history
    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      // Create new chat history if none exists
      console.log('Creating new chat history...');
      chatHistory = new ChatHistory({
        userId,
        conversations: [{
          messages: [
            { content: userPrompt, sender: "user", timestamp: new Date() },
            { content: assistantResponse, sender: "assistant", timestamp: new Date() }
          ]
        }]
      });
    } else {
      // Find the conversation that contains the messageId
      let messageAdded = false

      // Iterate through each conversation objects
      chatHistory.conversations.map((conv) => {
        if (conv._id){
        if (conv._id.toString() === messageId.toString()) {
          // Add the new messages at the end of the conversation
          conv.messages.push(
            { content: userPrompt, sender: "user", timestamp: new Date() },
            { content: assistantResponse, sender: "assistant", timestamp: new Date() }
          );
          messageAdded = true;
        }}
      })
      

      // If messageId was not found, we create a new conversation
      if (!messageAdded) {
        console.log('Message ID not found, creating new conversation...');
        chatHistory.conversations.push({
          _id: new mongoose.Types.ObjectId(),
          messages: [
            { content: userPrompt, sender: "user", timestamp: new Date() },
            { content: assistantResponse, sender: "assistant", timestamp: new Date() }
          ]
        });
      }
    }

    // Save the updated chat history
    const savedChat = await chatHistory.save();
    console.log('Saved chat history:');

    // Send AI response back to the user
    res.json({ aiResponse: assistantResponse });
  } catch (error) {
    console.error("Error processing chat:", error);
    if (error instanceof mongoose.Error) {
      console.error("Mongoose error details:", error);
    }
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});






// Route to fetch chat history
app.get('/chat/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  let chatData = await ChatHistory.findOne({ userId });

  if (!chatData) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ conversations: chatData.conversations });
});



// Route to create a new conversation
app.post('/chat/new/:id', async (req: Request, res: Response) => {
  const { id: userId } = req.params;  
  const _id = userId;
  let user = await User.findOne({ _id });
  if (!user) {
    console.log('error no user')
  } else {
  console.log(user.name)}

  try {
    // Find the user's chat history
    let chatHistory = await ChatHistory.findOne({ userId });

    
    // If no chat history exists, create one
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        conversations: [] // Initialize empty conversations array
      });
    }

    // Create a new conversation (messages array)
    const newConversation = {
      _id: new mongoose.Types.ObjectId(), // Generate new ID for the conversation
      messages: [] // Initialize with empty messages array
    };

    // Add the new conversation to chat history
    chatHistory.conversations.push(newConversation);
  
    // Save changes
    await chatHistory.save();
    console.log("created successfully ")

    // Return the newly created conversation
    res.status(201).json({
      message: 'New conversation created successfully',
      conversation: newConversation,
      name: user ? user.name : ''
    });

  } catch (error) {
    console.error('Error creating new conversation:', error);
    res.status(500).json({ error: "Error occurred while creating new conversation" });
  }
});




app.post('/user/history/:id', async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { messageId } = req.body;
    console.log("user history is loaded")

   try {
  
    // Find the user's chat history with lean() for better performance
    const chatHistory = await ChatHistory.findOne({ 
      userId 
    }).lean<ChatHistoryDocument>();

    if (!chatHistory) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Chat history not found for the user'
      });
    }
   

    let chatMessage = {}

    for (let i = 0; i < chatHistory.conversations.length; i++) {
      console.log(chatHistory.conversations[i]._id );
      console.log(messageId);
      if (chatHistory.conversations[i]._id == messageId){
        chatMessage = chatHistory.conversations[i]
      }
    };
  

    console.log(chatMessage)

    if (Object.keys(chatMessage).length === 0) {
      return res.status(404).json({ 
        status: 'error',  
        message: 'Message not found in chat history'
      });
    }


    console.log(chatMessage)
    // Respond with standardized success format
    return res.status(200).json({
      status: 'success',
      data: chatMessage
    });

  } catch (error) {
    console.error('Error retrieving chat message:', error);
    
    // Return a safe error response
    return res.status(500).json({ 
      status: 'error',
      message: 'An error occurred while retrieving the chat message',
    });
  } 
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


