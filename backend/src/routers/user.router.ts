import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { SECRET, type JWTClaim } from "../jwtclaim.js";

const router = express.Router();

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Passwords are hashed with bcrypt before storage; the password is never returned.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing or invalid name, email, or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequestError'
 *       409:
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictError'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic input validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ status: 400, message: "Name is required" });
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ status: 400, message: "A valid email is required" });
    }
    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        status: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hash,
      },
      omit: { password: true },
    });

    return res.status(201).json(createdUser);
  } catch (error: any) {
    console.error("Register error:", error);

    // Prisma unique constraint violation (duplicate email)
    if (error.code === "P2002") {
      return res.status(409).json({ status: 409, message: "Email already registered" });
    }

    return res.status(500).json({ status: 500, message: "An error occurred" });
  }
});

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     description: Verifies email and password, then returns a signed JWT (60 minute expiry) for use as a Bearer token on protected routes.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email and password are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequestError'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 400, message: "Email and password required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(401).json({ status: 401, message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: 401, message: "Invalid email or password" });
    }

    const myUserClaim: JWTClaim = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(myUserClaim, SECRET, { expiresIn: "60m" });

    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: 500, message: "An error occurred" });
  }
});

export default router;
