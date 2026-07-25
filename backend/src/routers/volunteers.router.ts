import express from "express";
import bcrypt from "bcrypt";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";
import { BadRequest, validateBody } from "../middleware/index.js";
import { volunteerCreateSchema, volunteerUpdateSchema } from "../schemas/volunteer.schema.js";

const router = express.Router();

const SALT_ROUNDS = 12;

/**
 * @openapi
 * /volunteers:
 *   post:
 *     summary: Create a new volunteer
 *     description: >
 *       Creates a volunteer record. Requires an authenticated administrator.
 *       The password is hashed with bcrypt before storage and is never returned.
 *       Approval status may be supplied; if omitted it defaults to PENDING.
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VolunteerCreateRequest'
 *     responses:
 *       201:
 *         description: Volunteer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Volunteer'
 *       400:
 *         description: Missing required fields, or an invalid email, password, skills list, document flag, or approval status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequestError'
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       409:
 *         description: That username or email is already registered
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
router.post("/", RequiresAuth, validateBody(volunteerCreateSchema), async (req, res) => {
  const { password, ...rest } = req.body;
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const createdVolunteer = await prisma.volunteer.create({
    data: { ...rest, password: hash },
    omit: { password: true },
  });

  return res.status(201).json(createdVolunteer);
});

/**
 * @openapi
 * /volunteers/{id}:
 *   patch:
 *     summary: Update an existing volunteer
 *     description: >
 *       Partially updates a volunteer. Only the fields present in the request body
 *       are changed; omitted fields are left as they are. Required fields may be
 *       omitted but cannot be blanked out. Supplying a password re-hashes it.
 *       Requires an authenticated administrator.
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The volunteer's numeric id
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VolunteerUpdateRequest'
 *     responses:
 *       200:
 *         description: Volunteer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Volunteer'
 *       400:
 *         description: Invalid id, a blanked-out required field, or an invalid email, password, skills list, document flag, or approval status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequestError'
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: No volunteer exists with that id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: The new username or email is already taken
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
router.patch("/:id", RequiresAuth, validateBody(volunteerUpdateSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw BadRequest("A valid volunteer id is required");
  }

  const { password, ...rest } = req.body;

  const data = { ...rest };

  if (password !== undefined) {
    data.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  if (Object.keys(data).length === 0) {
    throw BadRequest("No fields to update");
  }

  const updatedVolunteer = await prisma.volunteer.update({
    where: { id },
    data,
    omit: { password: true },
  });

  return res.json(updatedVolunteer);
});

export default router;
