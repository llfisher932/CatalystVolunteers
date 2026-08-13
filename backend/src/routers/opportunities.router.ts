import express from "express";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";
import { BadRequest, validateBody, validateQuery } from "../middleware/index.js";
import {
  opportunityCreateSchema,
  opportunityQuerySchema,
  opportunityUpdateSchema,
  type OpportunityQuery,
} from "../schemas/opportunity.schema.js";

const router = express.Router();

const RECENT_WINDOW_DAYS = 60;

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

export default router;
