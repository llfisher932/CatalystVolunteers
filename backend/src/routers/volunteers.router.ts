import express from "express";
import bcrypt from "bcrypt";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";
import { BadRequest, validateBody, validateQuery } from "../middleware/index.js";
import {
  volunteerCreateSchema,
  volunteerQuerySchema,
  volunteerUpdateSchema,
  type VolunteerQuery,
} from "../schemas/volunteer.schema.js";

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

/**
 * @openapi
 * /volunteers:
 *   get:
 *     summary: List volunteers, with optional search and filtering
 *     description: >
 *       Returns a paginated summary list of volunteers. The default filter shows
 *       volunteers who are APPROVED or PENDING; use `status` to narrow to a single
 *       status or `ALL` to remove the filter. The `q` parameter searches across
 *       first name, last name, username, email, and skills. An empty result set is
 *       a successful response with an empty `data` array, not a 404.
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text search across name, username, email, and skills
 *         example: "smith"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DEFAULT, ALL, PENDING, APPROVED, DISAPPROVED, INACTIVE]
 *           default: DEFAULT
 *         description: DEFAULT shows APPROVED and PENDING; ALL removes the filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *     responses:
 *       200:
 *         description: A page of matching volunteers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VolunteerListResponse'
 *       400:
 *         description: Invalid status, page, or limit
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
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.get("/", RequiresAuth, validateQuery(volunteerQuerySchema), async (_req, res) => {
  const { q, status, page, limit } = res.locals.query as VolunteerQuery;

  // DEFAULT mirrors the doc's default view (Approved + Pending);
  // ALL applies no status filter at all.
  let statusFilter: string[] | undefined;
  if (status === "DEFAULT") {
    statusFilter = ["APPROVED", "PENDING"];
  } else if (status !== "ALL") {
    statusFilter = [status];
  }

  const where = {
    ...(statusFilter && { approvalStatus: { in: statusFilter as any } }),
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { username: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { skills: { has: q } },
      ],
    }),
  };

  // Run the page query and the total count concurrently for speed
  const [volunteers, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approvalStatus: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.volunteer.count({ where }),
  ]);

  return res.json({
    data: volunteers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @openapi
 * /volunteers/{id}:
 *   get:
 *     summary: Get a single volunteer
 *     description: >
 *       Returns the full volunteer record along with the opportunities they are
 *       matched to. The password is never included.
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
 *     responses:
 *       200:
 *         description: The volunteer, including matched opportunities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Volunteer'
 *       400:
 *         description: The id is not a positive integer
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
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.get("/:id", RequiresAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw BadRequest("A valid volunteer id is required");
  }

  const volunteer = await prisma.volunteer.findUniqueOrThrow({
    where: { id },
    omit: { password: true },
    include: {
      matches: {
        include: {
          opportunity: { select: { id: true, title: true, center: true, createdAt: true } },
        },
      },
    },
  });

  return res.json(volunteer);
});

export default router;
