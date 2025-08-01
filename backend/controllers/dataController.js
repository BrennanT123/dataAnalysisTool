import { PrismaClient } from "../prisma/generated/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

