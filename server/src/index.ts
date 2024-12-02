
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
    callbackURL: "http://localhost:3000/google-auth/callback",
    scope: ["profile", "email"]
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      console.log(user)
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
  console.log('Database connected successfully');
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
    failureRedirect: '/signup',
    session: true
  }), async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;
      console.log(user)
      console.log('it wokrrs')
      
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
      console.log("redirecting")
      res.redirect(`/`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// Logout route
app.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('authToken');
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  });
});








// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});