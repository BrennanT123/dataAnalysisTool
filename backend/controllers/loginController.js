import { validateNewUser } from "../lib/validation.js";
import { PrismaClient } from "../prisma/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
        message: "User registered successfully",
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
      return res.status(500).json({
        errors: [{ msg: "Internal server error. Please try again later." }],
      });
    }
  },
];
