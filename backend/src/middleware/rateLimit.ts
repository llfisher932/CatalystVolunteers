import rateLimit from "express-rate-limit";

//Logan: First time using this, seems like something worth implementing for a real product.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 attempts per window per IP
  standardHeaders: "draft-7", // sends RateLimit-* response headers
  legacyHeaders: false,
  message: { status: 429, message: "Too many login attempts. Try again later." },
});
