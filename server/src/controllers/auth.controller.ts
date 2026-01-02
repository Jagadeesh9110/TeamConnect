import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';


const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
}

// register a user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, password, email } = req.body;
        if (!name || !password || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = new User({
            name,
            password,
            email
        })

        await newUser.save();
        const token = generateToken(newUser.id.toString(), newUser.email);
        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// login user 
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user.id.toString(), user.email);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

