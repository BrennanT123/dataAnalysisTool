import express from "express";
import * as loginController from "../controllers/loginController.js";

const loginRouter = express.Router();

loginRouter.post("/login", loginController.loginUser);
loginRouter.post("/register", loginController.registerUser);

export default loginRouter;
