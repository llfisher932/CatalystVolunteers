import express from "express";
import bcrypt from "bcrypt";
import prisma from "../db.js";
import { RequiresAuth } from "../auth/auth.js";

const router = express.Router();

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("", RequiresAuth, async (req, res, next) => {
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

    const clean = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null);
    const cleanLower = (v: unknown): string | null => (typeof v === "string" ? v.trim().toLowerCase() : null);
    const cleanRequired = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

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

export default router;
