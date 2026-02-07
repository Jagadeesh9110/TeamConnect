import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";



// helper to hash refresh token before DB storage
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

// helper to set refresh token cookie
const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
  });
};

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify refresh token (signature + expiry)
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as RefreshTokenPayload;

    const { userId, tokenVersion } = decoded;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // tokenVersion check
    if (user.tokenVersion !== tokenVersion) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Refresh token hash check
    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken(
      user.id,
      user.tokenVersion
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashToken(newRefreshToken),
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    const newAccessToken = generateAccessToken(
      user.id,
      user.email,
      user.tokenVersion
    );

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    // Any failure → logout
    res.clearCookie("refreshToken", {
      path: "/api/auth/refresh",
    });

    return res.status(401).json({ error: "Unauthorized" });
  }
};

// this code is single token one which will be not used further as we are implementing multiple refresh token strategy

// const generateToken = (userId:string,email:string)=>{
//     return jwt.sign({userId,email},process.env.JWT_SECRET as string,{expiresIn:'1d'});
// }

// // Helper to set cookie
// const sendTokenCookie = (res: Response, token: string) => {
//     res.cookie('token', token, {
//         httpOnly: true, // Prevent XSS
//         secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
//         sameSite: 'strict', // Prevent CSRF
//         maxAge: 24 * 60 * 60 * 1000 // 1 day
//     });
// };

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

    return res.status(201).json({
        success: true,
        data: {
            message: "User registered successfully",
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

        const accessToken = generateAccessToken(
          user.id,
          user.email,
          user.tokenVersion
        );

       const refreshToken = generateRefreshToken(
            user.id,
            user.tokenVersion
       );

       await prisma.user.update({
           where: { id: user.id },
           data: {
                refreshTokenHash: hashToken(refreshToken),
            },
       });

        setRefreshCookie(res, refreshToken);

        return res.status(200).json({
            success: true,
            accessToken,
            data: {
                message: "Login successful",
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


// logout a user (refresh token based)
export const logoutUser = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.userId) {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshTokenHash: null },
    });
  }

  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh", 
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    error: null,
  });
};


// get current user details
export const getMeUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        displayName: true,
        isOnline: true,
        lastSeenAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};