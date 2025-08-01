import { PrismaClient } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

//For authenticating users based on JWT tokens
export const authenticateUser = (req, res, next) => {
  //Get auth header value
  const authHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      errors: [{ msg: "No token provided or bad authorization format" }],
    });
  }
  //Split at the space and get the token
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ errors: [{ msg: "Invalid or expired token" }] });
  }
};

//for loose authenticating users based on JWT tokens
export const authenticateUserLoose = (req, res, next) => {
  //Get auth header value
  const authHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.isLoggedIn = false;
    next();
  }
  //Split at the space and get the token
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    req.isLoggedIn = true;
    //return res.status(200).json({ msg: 'Authentication succesful.', user: req.user });
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ errors: [{ msg: "Invalid or expired token" }] });
  }
};
