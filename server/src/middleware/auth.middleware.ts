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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized :Invalid (or) expired token" });
    }

};