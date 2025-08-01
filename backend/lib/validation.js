import { body, query, validationResult } from "express-validator";
import { PrismaClient } from "../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

const alphaErr = "must only contain letters.";
const nameLengthErr = "must be be between 1 and 10 characters.";

export const validateNewUser = [
  body("user_email")
    .notEmpty()
    .withMessage("Please fill out email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom(async (email, { req }) => {
      const checkAvailable = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (checkAvailable) {
        throw new Error("Account with email already exists.");
      }
      return true;
    }),

  body("first_name")
    .notEmpty()
    .withMessage("Please fill out first name")
    .trim()
    .isAlpha()
    .withMessage(`First name ${alphaErr}`)
    .isLength({ min: 1, max: 10 })
    .withMessage(`First name ${nameLengthErr}`),

  body("last_name")
    .notEmpty()
    .withMessage("Please fill out last name")
    .trim()
    .isAlpha()
    .withMessage(`Last name ${alphaErr}`)
    .isLength({ min: 1, max: 10 })
    .withMessage(`Last name ${nameLengthErr}`),

  body("password")
    .notEmpty()
    .withMessage("Please fill out password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and include at least one uppercase, lowercase, number, and special character."
    )
    .isLength({ max: 64 })
    .withMessage("Password must be less than 64 characters long"),

  body("confirm_password")
    .notEmpty()
    .withMessage("Please fill out confirm password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];