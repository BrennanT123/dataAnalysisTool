import { validateNewUser } from "../lib/validation.js";
import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

export const registerUser = [
  validateNewUser,
  async (req, res) => {
 
    const validateErrors = validationResult(req);
    if (!validateErrors.isEmpty()) {
      return res.status(400).json({ errors: validateErrors.array() });
    }


    //formats the email to lowercase and trims whitespace
    const email = req.body.user_email.trim().toLowerCase();
    const hash = await bcrypt.hash(req.body.password, 10);
    try {
      const newUser = await prisma.user.create({
        data: {
          email: req.body.user_email,
          firstName: req.body.first_name,
          lastName: req.body.last_name,
          password: hash,
        },
      });
      return res.status(201).json({
        msg: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email is already registered." }] });
      }
      console.error("Error registering user:", error);
      console.error(error.stack);     
      return res.status(500).json({
        errors: [{ msg: "Internal server error. Please try again later." }],
      });
    }
  },
];

export const loginUser = async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(401)
        .json({ errors: [{ msg: "Invalid email or password" }] });
    }

    const checkPassMatch = await bcrypt.compare(password, user.password);

    if (!checkPassMatch) {
      return res
        .status(401)
        .json({ errors: [{ msg: "Invalid email or password" }] });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      errors: [{ msg: "There was an error logging in" }],
    });
  }
};
