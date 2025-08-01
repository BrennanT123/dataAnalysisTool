import express from "express";
import dotenv from "dotenv";
import dataRouter from "./routes/dataRouter";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routes/authRouter";

dotenv.config();

const app = express();

//for railway
app.set('trust proxy', 1);

//cors setup
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
    credentials: true,
}


app.use(cors(corsOptions));

//for security. sets various http headers to help protetc the app
app.use(helmet());

// JSON parsing middleware
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));


//to check if the server is running
app.get("/", (req, res) => {
  res.send("API is running");
});

//for error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});


//routes go here
app.use("/dataRouter", dataRouter);
app.use("/authRouter", authRouter);

// Start the session
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on port ${PORT}!`));


