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
import { sendEmail } from "../services/email.service.js";

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
      return res.status(401).json({ success: false, error: "Unauthorized" });
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
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // tokenVersion check
    if (user.tokenVersion !== tokenVersion) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Refresh token hash check
    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
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
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    // Any failure → logout
    res.clearCookie("refreshToken", {
      path: "/api/auth/refresh",
    });

    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

// register a user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token (URL-safe, 32 bytes)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your TeamConnect account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 16px;">Welcome to TeamConnect!</h2>
          <p style="line-height: 1.6; margin: 0 0 8px;">
            Hi <strong style="color: #60a5fa;">${fullName}</strong>, thanks for signing up.
          </p>
          <p style="line-height: 1.6; margin: 0 0 24px;">
            Please verify your email address to activate your account:
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Verify Email
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
            This link expires in 24 hours. If you didn't create this account, you can ignore this email.
          </p>
        </div>
      `,
      text: `Hi ${fullName}, verify your TeamConnect account: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
        },
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification token",
      });
    }

    // Already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        data: { message: "Email is already verified. You can login." },
      });
    }

    // Check expiry
    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Verification link has expired. Please request a new one.",
      });
    }

    // Mark as verified, clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      data: { message: "Email verified successfully. You can now login." },
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// resend verification email
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists — return success either way
      return res.status(200).json({
        success: true,
        data: { message: "If the email exists, a verification link has been sent." },
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your TeamConnect account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 16px;">Verify your email</h2>
          <p style="line-height: 1.6; margin: 0 0 24px;">
            Click below to verify your TeamConnect account:
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Verify Email
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
      text: `Verify your TeamConnect account: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });

    return res.status(200).json({
      success: true,
      data: { message: "If the email exists, a verification link has been sent." },
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

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

    // Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        code: "EMAIL_NOT_VERIFIED",
      });
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
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
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
      data: {
        refreshTokenHash: null,
        isOnline: false,
        lastSeenAt: new Date(),
      },
    });
  }

  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });

  return res.status(200).json({
    success: true,
    data: { message: "Logged out successfully" },
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
      data: { user },
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};