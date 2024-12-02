import express, { Request, Response } from 'express';
import { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import authMiddleware from '../src/auth';
import { JwtPayload } from 'jsonwebtoken';



// Type definitions
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  picture?: string;
}


// Extend Express's Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Add user property to Request type
    }
  }
}



const router = express.Router();


// Regular signup route
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully!'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Regular login route
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email }) as IUser;
    if (!existingUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!existingUser.password) {
      return res.status(400).json({ message: 'Please login with Google' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      process.env.ACCESS_TOKEN_SECRET || 'default_secret',
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      message: 'Login successful',
      userId: existingUser._id.toString()
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Protected route
router.get('/protected', authMiddleware, (req: Request, res: Response) => {

   // Ensure req.user is defined before using it
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }


  res.json({ message: 'User authenticated', userId: req.user.id });
});

// Get user details
router.get('/user/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user details', error });
  }
});



export { router };