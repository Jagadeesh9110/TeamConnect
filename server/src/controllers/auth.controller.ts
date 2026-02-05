import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';


const generateToken = (userId:string,email:string)=>{
    return jwt.sign({userId,email},process.env.JWT_SECRET as string,{expiresIn:'1d'});
}

// Helper to set cookie
const sendTokenCookie = (res: Response, token: string) => {
    res.cookie('token', token, {
        httpOnly: true, // Prevent XSS
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        sameSite: 'strict', // Prevent CSRF
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

// register a user
export const registerUser= async(req:Request,res:Response)=>{
     const {fullName, email, password }=req.body;
     if(!fullName || !email || !password){
         return res.status(400).json({
            "data": null,
            "success": false,
            "error": "All fields are required"
        });
     }

    const existingUser = await prisma.user.findUnique({ where: { email } });
     if (existingUser) {
        return res.status(409).json({
            "data": null,
            "success": false,
            "error": "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: { fullName, email, password: hashedPassword }
    });
    
    const token= generateToken(newUser.id,newUser.email);
    sendTokenCookie(res, token);
    return res.status(201).json({
        success: true,
        data: {
            message: "User registered successfully",
            token: token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email
            }
        }
    });
}

// login a user

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Email and password required" });
        }

        // Find user by unique email 
        const user = await prisma.user.findUnique({ where: { email } });
        
        // Check if user exists and verify password
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        // Generate token and set cookie
        const token = generateToken(user.id, user.email);
        sendTokenCookie(res, token);

        return res.status(200).json({
            success: true,
            data: {
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                },
            },
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};


// logout a user
export const logoutUser = async (req: Request, res: Response) => {
    // Set the cookie to an empty string
    // Set the expiry date to a time in the past (e.g., 0)
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), // Immediately expires the cookie
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

