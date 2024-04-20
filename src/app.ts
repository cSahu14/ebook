import express from "express";
import globalErrorHandler from "./middlewares/golbalErrorHandler";

const app = express();

// http methods

app.get("/", (req, res, next) => {
  res.json({ message: "Hello world." });
});

// Global error handler

app.use(globalErrorHandler);

export default app;
