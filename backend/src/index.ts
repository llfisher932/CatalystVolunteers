import express from "express";
import cors from "cors";
import userRouter from "./routers/user.router.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

let app = express();
app.use(
  cors({
    origin: true, // Accept all origins
    credentials: true, // Allow cookies and authentication headers
  }),
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI at /api-docs

app.use("/users", userRouter);

//start express app on port 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
