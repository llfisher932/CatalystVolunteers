import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { SECRET, type JWTClaim } from "../jwtclaim.js";
import { userRegisterSchema, userLoginSchema } from "../schemas/user.schema.js";
import { Unauthorized, validateBody, loginLimiter } from "../middleware/index.js";

const router = express.Router();

const SALT_ROUNDS = 12;
const DUMMY_HASH = "$2b$12$aqTPEjiJtoQ2n0xfCzZInubuBFIBe4U3pECx.mKwd2icyHLU0Wute";

// IMPORTANT: register endpoint is here to be re enabled if we want to create new admins, but it is disabled as we already have an account set up.
// /**
//  * @openapi
//  * /users/register:
//  *   post:
//  *     summary: Register a new administrator
//  *     description: Creates a new administrator account. Passwords are hashed with bcrypt before storage; the password is never returned.
//  *     tags: [Users]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/RegisterRequest'
//  *     responses:
//  *       201:
//  *         description: User created successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/User'
//  *       400:
//  *         description: Missing or invalid name, username, or password
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/BadRequestError'
//  *       409:
//  *         description: That username is already taken
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ConflictError'
//  *       500:
//  *         description: Unexpected server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ServerError'
//  */
// router.post("/register", validateBody(userRegisterSchema), async (req, res) => {
//   const { name, username, password } = req.body;

//   const hash = await bcrypt.hash(password, SALT_ROUNDS);

//   const createdUser = await prisma.user.create({
//     data: { name, username, password: hash },
//     omit: { password: true },
//   });

//   return res.status(201).json(createdUser);
// });

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Log in an administrator
 *     description: Verifies username and password, then returns a signed JWT (60 minute expiry) for use as a Bearer token on protected routes.
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
 *         description: Username and password are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequestError'
 *       401:
 *         description: Invalid username or password
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
router.post("/login", loginLimiter, validateBody(userLoginSchema), async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      password: true,
    },
  });

  // Compare against a dummy hash when no user is found so both paths take the
  // same time. Returning early here would let an attacker discover which
  // usernames exist by measuring response times.
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !valid) {
    throw Unauthorized("Invalid username or password");
  }

  const myUserClaim: JWTClaim = {
    id: user.id,
    username: user.username,
    name: user.name,
  };

  const token = jwt.sign(myUserClaim, SECRET, { expiresIn: "60m" });

  return res.json({ token });
});

export default router;
