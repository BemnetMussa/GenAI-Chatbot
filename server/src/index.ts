
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
  const { question: userPrompt, userId} = req.body

  if (!userPrompt) {
      return res.status(400).json({ error: "Question is required" });
    }

  try {
    
    const result = await model.generateContent(userPrompt);

    ChatHistory.findOne({ userId }).then(chatHistory => {
      if (!chatHistory) {
        // Create a new chat history document if it doesn't exist
        const newChatHistory = new ChatHistory({
          userId,
          messages: [
            { content: userPrompt, sender: "user", timestamp: new Date() }, // User's message
            { content: result.response.text(), sender: "assistant", timestamp: new Date() } // Assistant's response
          ]
        });
        newChatHistory.save();
      } else {
        // Update the existing chat history
        chatHistory.messages.push(
          { content: userPrompt, sender: "user", timestamp: new Date() }, // User's message
          { content: result.response.text(), sender: "assistant", timestamp: new Date() } // Assistant's response
        );
        chatHistory.save();
      }
    });


    res.json({aiResponse: result.response.text()})

  } catch (error) {
    console.log(error)
    res.status(402).json({error: "an error occured try again"})
    
  }

});


app.get('/chat/history/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find chat history for the user
    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.json({ 
        conversations: [] 
      });
    }

    // Format messages into conversations array
    const conversations = [];
    for (let i = 0; i < chatHistory.messages.length; i += 2) {
      if (chatHistory.messages[i] && chatHistory.messages[i + 1]) {
        conversations.push({
          request: chatHistory.messages[i].content,
          response: chatHistory.messages[i + 1].content
        });
      }
    }

    return res.json({
      conversations
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

