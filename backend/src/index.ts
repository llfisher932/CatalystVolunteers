import express from "express";
import cors from "cors";
import userRouter from "./routers/user.router.js";

let app = express();
app.use(
  cors({
    origin: true, // Accept all origins
    credentials: true, // Allow cookies and authentication headers
  }),
);

app.use(express.json());

app.use("/users", userRouter);

//start express app on port 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
