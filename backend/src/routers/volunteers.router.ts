import express from "express";
import bcrypt from "bcrypt";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";

const router = express.Router();

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null);
const cleanLower = (v: unknown): string | null => (typeof v === "string" ? v.trim().toLowerCase() : null);
const cleanRequired = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const setIf = <T>(v: unknown, value: T) => (v !== undefined ? value : {});

const APPROVAL_STATUSES = ["PENDING", "APPROVED", "DISAPPROVED", "INACTIVE"] as const;

/**
 * @openapi
 * /volunteers:
 *   post:
 *     summary: Create a new volunteer
 *     description: >
 *       Creates a volunteer record. Requires an authenticated administrator.
 *       The password is hashed with bcrypt before storage and is never returned.
 *       New volunteers are created with an approval status of PENDING.
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
 *         description: Missing required fields, or an invalid email, password, skills list, or document flag
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
router.post("/", RequiresAuth, async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      username,
      password,
      email,
      address,
      homePhone,
      workPhone,
      cellPhone,
      educationalBackground,
      currentLicenses,
      skills,
      availability,
      emergencyName,
      emergencyHomePhone,
      emergencyWorkPhone,
      emergencyEmail,
      emergencyAddress,
      driversLicenseOnFile,
      socialSecurityOnFile,
    } = req.body;

    if (!firstName || !lastName || !username || !password || !email) {
      return res.status(400).json({ status: 400, message: "Missing required fields" });
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ status: 400, message: "A valid email is required" });
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        status: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }
    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ status: 400, message: "Skills must be an array" });
    }
    if (driversLicenseOnFile !== undefined && typeof driversLicenseOnFile !== "boolean") {
      return res.status(400).json({ status: 400, message: "driversLicenseOnFile must be a boolean" });
    }
    if (socialSecurityOnFile !== undefined && typeof socialSecurityOnFile !== "boolean") {
      return res.status(400).json({ status: 400, message: "socialSecurityOnFile must be a boolean" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const createdVolunteer = await prisma.volunteer.create({
      data: {
        firstName: cleanRequired(firstName),
        lastName: cleanRequired(lastName),
        username: cleanRequired(username),
        password: hash,
        email: cleanRequired(email).toLowerCase(),
        address: clean(address),
        homePhone: clean(homePhone),
        workPhone: clean(workPhone),
        cellPhone: clean(cellPhone),
        educationalBackground: clean(educationalBackground),
        currentLicenses: clean(currentLicenses),
        skills: Array.isArray(skills) ? skills.filter((s) => typeof s === "string").map((s) => s.trim()) : [],
        availability: clean(availability),
        emergencyName: clean(emergencyName),
        emergencyHomePhone: clean(emergencyHomePhone),
        emergencyWorkPhone: clean(emergencyWorkPhone),
        emergencyEmail: cleanLower(emergencyEmail),
        emergencyAddress: clean(emergencyAddress),
        driversLicenseOnFile: driversLicenseOnFile ?? false,
        socialSecurityOnFile: socialSecurityOnFile ?? false,
      },
      omit: { password: true },
    });

    return res.status(201).json(createdVolunteer);
  } catch (error: any) {
    console.error("Volunteer creation error:", error);

    // Prisma unique constraint violation (duplicate email)
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] ?? "field";
      return res.status(409).json({ status: 409, message: `That ${field} is already registered` });
    }

    return res.status(500).json({ status: 500, message: "An error occurred" });
  }
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
router.patch("/:id", RequiresAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ status: 400, message: "A valid volunteer id is required" });
    }

    const {
      firstName,
      lastName,
      username,
      password,
      email,
      address,
      homePhone,
      workPhone,
      cellPhone,
      educationalBackground,
      currentLicenses,
      skills,
      availability,
      emergencyName,
      emergencyHomePhone,
      emergencyWorkPhone,
      emergencyEmail,
      emergencyAddress,
      driversLicenseOnFile,
      socialSecurityOnFile,
      approvalStatus,
    } = req.body;

    // Required fields may be omitted (partial update), but can't be blanked out
    for (const [key, value] of Object.entries({ firstName, lastName, username })) {
      if (value !== undefined && (typeof value !== "string" || !value.trim())) {
        return res.status(400).json({ status: 400, message: `${key} cannot be empty` });
      }
    }
    if (email !== undefined && (typeof email !== "string" || !EMAIL_REGEX.test(email))) {
      return res.status(400).json({ status: 400, message: "A valid email is required" });
    }
    if (password !== undefined && (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH)) {
      return res.status(400).json({
        status: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }
    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ status: 400, message: "Skills must be an array" });
    }
    if (driversLicenseOnFile !== undefined && typeof driversLicenseOnFile !== "boolean") {
      return res.status(400).json({ status: 400, message: "driversLicenseOnFile must be a boolean" });
    }
    if (socialSecurityOnFile !== undefined && typeof socialSecurityOnFile !== "boolean") {
      return res.status(400).json({ status: 400, message: "socialSecurityOnFile must be a boolean" });
    }
    if (approvalStatus !== undefined && !APPROVAL_STATUSES.includes(approvalStatus)) {
      return res.status(400).json({
        status: 400,
        message: `approvalStatus must be one of: ${APPROVAL_STATUSES.join(", ")}`,
      });
    }

    // Only hash if a new password was actually supplied
    const hashed = password !== undefined ? await bcrypt.hash(password, SALT_ROUNDS) : undefined;

    const updatedVolunteer = await prisma.volunteer.update({
      where: { id },
      data: {
        ...setIf(firstName, { firstName: cleanRequired(firstName) }),
        ...setIf(lastName, { lastName: cleanRequired(lastName) }),
        ...setIf(username, { username: cleanRequired(username) }),
        ...setIf(hashed, { password: hashed as string }),
        ...setIf(email, { email: cleanRequired(email).toLowerCase() }),
        ...setIf(address, { address: clean(address) }),
        ...setIf(homePhone, { homePhone: clean(homePhone) }),
        ...setIf(workPhone, { workPhone: clean(workPhone) }),
        ...setIf(cellPhone, { cellPhone: clean(cellPhone) }),
        ...setIf(educationalBackground, { educationalBackground: clean(educationalBackground) }),
        ...setIf(currentLicenses, { currentLicenses: clean(currentLicenses) }),
        ...setIf(skills, {
          skills: Array.isArray(skills) ? skills.filter((s) => typeof s === "string").map((s) => s.trim()) : [],
        }),
        ...setIf(availability, { availability: clean(availability) }),
        ...setIf(emergencyName, { emergencyName: clean(emergencyName) }),
        ...setIf(emergencyHomePhone, { emergencyHomePhone: clean(emergencyHomePhone) }),
        ...setIf(emergencyWorkPhone, { emergencyWorkPhone: clean(emergencyWorkPhone) }),
        ...setIf(emergencyEmail, { emergencyEmail: cleanLower(emergencyEmail) }),
        ...setIf(emergencyAddress, { emergencyAddress: clean(emergencyAddress) }),
        ...setIf(driversLicenseOnFile, { driversLicenseOnFile }),
        ...setIf(socialSecurityOnFile, { socialSecurityOnFile }),
        ...setIf(approvalStatus, { approvalStatus }),
      },
      omit: { password: true },
    });

    return res.json(updatedVolunteer);
  } catch (error: any) {
    console.error("Volunteer update error:", error);

    // Record not found
    if (error.code === "P2025") {
      return res.status(404).json({ status: 404, message: "Volunteer not found" });
    }
    // Unique constraint violation
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] ?? "field";
      return res.status(409).json({ status: 409, message: `That ${field} is already registered` });
    }

    return res.status(500).json({ status: 500, message: "An error occurred" });
  }
});

export default router;
