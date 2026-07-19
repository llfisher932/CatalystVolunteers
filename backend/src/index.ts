import express from "express";
import cors from "cors";
import userRouter from "./routers/user.router.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: true, // Accept all origins
    credentials: true, // Allow cookies and authentication headers
  }),
);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/users", userRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
