import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {

        // Read token from cookies
        const token = req.cookies.token; 
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        
        // Verify token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        req.user = decoded;

        next();
        
    } catch (err) {
        // Clear expired/invalid cookies automatically upon failure
        res.clearCookie('token'); 
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

