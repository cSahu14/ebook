import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/golbalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();
app.use(
  cors({
    origin: config.frontendDomain,
  })
);
app.use(express.json());

// http methods

app.get("/", (req, res, next) => {
  res.json({ message: "Hello world." });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
