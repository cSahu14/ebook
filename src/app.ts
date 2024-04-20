import express from "express";
import globalErrorHandler from "./middlewares/golbalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();

// http methods

app.get("/", (req, res, next) => {
  res.json({ message: "Hello world." });
});

app.use("/api/users", userRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
