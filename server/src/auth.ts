
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Authentication middleware to protect routes
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Decode the JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default") as JwtPayload;
 

    req.user = decoded; 
  
    next(); 
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
