import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { ENV } from "../config/env";

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) { res.status(400).json({ success: false, message: "Email already registered" }); return; }
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id.toString(), user.role);
    res.status(201).json({ success: true, message: "Account created successfully", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ success: false, message: "Server error", error }); }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) { res.status(401).json({ success: false, message: "Invalid email or password" }); return; }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) { res.status(401).json({ success: false, message: "Invalid email or password" }); return; }
    if (!user.isActive) { res.status(403).json({ success: false, message: "Account is deactivated" }); return; }
    const token = generateToken(user._id.toString(), user.role);
    res.status(200).json({ success: true, message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ success: false, message: "Server error", error }); }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id).select("-password");
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, message: "Server error", error }); }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) { res.status(404).json({ success: false, message: "No account found with this email" }); return; }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successfully! You can now login." });
  } catch (error) { res.status(500).json({ success: false, message: "Server error", error }); }
};