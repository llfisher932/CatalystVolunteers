import express from "express";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";
import { BadRequest, validateBody, validateQuery } from "../middleware/index.js";
import {
  assignVolunteersSchema,
  opportunityCreateSchema,
  opportunityQuerySchema,
  opportunityUpdateSchema,
  type AssignVolunteersInput,
  type OpportunityQuery,
} from "../schemas/opportunity.schema.js";

const router = express.Router();

const RECENT_WINDOW_DAYS = 60;

/**
 * @openapi
 * /opportunities/centers:
 *   get:
 *     summary: List the distinct centers currently in use
 *     description: >
 *       Returns every center name that has at least one opportunity, sorted
 *       alphabetically. Intended to populate the center filter and to offer
 *       existing names when creating an opportunity.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The centers in use
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Downtown", "Northside"]
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
// Declared before /:id so "centers" isn't parsed as an id
router.get("/centers", RequiresAuth, async (_req, res) => {
  const rows = await prisma.opportunity.findMany({
    distinct: ["center"],
    select: { center: true },
    orderBy: { center: "asc" },
  });

  return res.json(rows.map((row) => row.center));
});

/**
 * @openapi
 * /opportunities:
 *   get:
 *     summary: List opportunities, with optional search and filtering
 *     description: >
 *       Returns a paginated list of opportunities. The default filter shows only
 *       those created in the last 60 days; use `filter=ALL` to remove the date
 *       window. The `q` parameter searches across title and description, and
 *       `center` narrows to a single center. An empty result set is a successful
 *       response with an empty `data` array, not a 404.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text search across title and description
 *         example: "food bank"
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [RECENT, ALL]
 *           default: RECENT
 *         description: RECENT limits to the last 60 days; ALL removes the date filter
 *       - in: query
 *         name: center
 *         schema:
 *           type: string
 *         description: Narrow to a single center
 *         example: "Downtown"
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
 *         description: A page of matching opportunities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityListResponse'
 *       400:
 *         description: Invalid filter, page, or limit
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
router.get("/", RequiresAuth, validateQuery(opportunityQuerySchema), async (_req, res) => {
  const { q, filter, center, page, limit } = res.locals.query as OpportunityQuery;

  const recentCutoff = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const where = {
    ...(filter === "RECENT" && { createdAt: { gte: recentCutoff } }),
    ...(center && { center }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return res.json({
    data: opportunities,
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
 * /opportunities/{id}:
 *   get:
 *     summary: Get a single opportunity
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The opportunity's numeric id
 *         example: 1
 *     responses:
 *       200:
 *         description: The opportunity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
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
 *         description: No opportunity exists with that id
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
    throw BadRequest("A valid opportunity id is required");
  }

  const opportunity = await prisma.opportunity.findUniqueOrThrow({
    where: { id },
    include: {
      matches: {
        include: {
          volunteer: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  return res.json(opportunity);
});

/**
 * @openapi
 * /opportunities:
 *   post:
 *     summary: Create a new opportunity
 *     description: Creates an opportunity. Requires an authenticated administrator.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpportunityCreateRequest'
 *     responses:
 *       201:
 *         description: Opportunity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Missing or invalid title or center
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
router.post("/", RequiresAuth, validateBody(opportunityCreateSchema), async (req, res) => {
  const createdOpportunity = await prisma.opportunity.create({
    data: req.body,
  });

  return res.status(201).json(createdOpportunity);
});

/**
 * @openapi
 * /opportunities/{id}:
 *   patch:
 *     summary: Update an existing opportunity
 *     description: >
 *       Partially updates an opportunity. Only the fields present in the request
 *       body are changed; omitted fields are left as they are. Required fields may
 *       be omitted but cannot be blanked out.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The opportunity's numeric id
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpportunityUpdateRequest'
 *     responses:
 *       200:
 *         description: Opportunity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Invalid id, no fields to update, or a blanked-out required field
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
 *         description: No opportunity exists with that id
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
 *   delete:
 *     summary: Delete an opportunity
 *     description: >
 *       Permanently removes an opportunity. Any volunteer matches for it are
 *       removed along with it.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The opportunity's numeric id
 *         example: 1
 *     responses:
 *       204:
 *         description: Opportunity deleted
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
 *         description: No opportunity exists with that id
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
router.patch("/:id", RequiresAuth, validateBody(opportunityUpdateSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw BadRequest("A valid opportunity id is required");
  }

  if (Object.keys(req.body).length === 0) {
    throw BadRequest("No fields to update");
  }

  const updatedOpportunity = await prisma.opportunity.update({
    where: { id },
    data: req.body,
  });

  return res.json(updatedOpportunity);
});

router.delete("/:id", RequiresAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw BadRequest("A valid opportunity id is required");
  }

  await prisma.opportunity.delete({ where: { id } });

  return res.status(204).send();
});

/**
 * @openapi
 * /opportunities/{id}/volunteers:
 *   put:
 *     summary: Set the volunteers assigned to an opportunity
 *     description: >
 *       Replaces the opportunity's assignment list with the volunteers given.
 *       Sending an empty array clears all assignments.
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The opportunity's numeric id
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignVolunteersRequest'
 *     responses:
 *       200:
 *         description: The opportunity with its updated assignment list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Invalid id, or a volunteer email that doesn't match an existing volunteer
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: No opportunity exists with that id
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
router.put("/:id/volunteers", RequiresAuth, validateBody(assignVolunteersSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw BadRequest("A valid opportunity id is required");
  }

  const volunteerEmails = [...new Set((req.body as AssignVolunteersInput).volunteerEmails)];

  const volunteers = await prisma.volunteer.findMany({
    where: { email: { in: volunteerEmails } },
    select: { id: true, email: true },
  });

  if (volunteers.length !== volunteerEmails.length) {
    const found = new Set(volunteers.map((v) => v.email));
    const missing = volunteerEmails.filter((email: string) => !found.has(email));
    throw BadRequest(`No volunteer found for: ${missing.join(", ")}`);
  }

  // this really should be a diff approach, but for this project this approach is fine.
  // we are deleting all vols and adding all the sent ones in ( so maybe lots of wasted operations )
  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      matches: {
        deleteMany: {},
        create: volunteers.map((volunteer) => ({ volunteerId: volunteer.id })),
      },
    },
    include: {
      matches: {
        include: {
          volunteer: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  return res.json(updated);
});

export default router;
