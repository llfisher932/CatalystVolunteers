/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: An administrator account.
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         username:
 *           type: string
 *           example: "jdoe"
 *     RegisterRequest:
 *       type: object
 *       required: [name, username, password]
 *       properties:
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         username:
 *           type: string
 *           minLength: 3
 *           example: "jdoe"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "correcthorsebatterystaple"
 *     LoginRequest:
 *       type: object
 *       required: [username, password]
 *       properties:
 *         username:
 *           type: string
 *           example: "admin"
 *         password:
 *           type: string
 *           format: password
 *           example: "password"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT bearer token, valid for 60 minutes
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     ApprovalStatus:
 *       type: string
 *       enum: [PENDING, APPROVED, DISAPPROVED, INACTIVE]
 *       example: "PENDING"
 *
 *     VolunteerMatch:
 *       type: object
 *       description: An opportunity a volunteer is assigned to.
 *       properties:
 *         matchedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-15T14:30:00.000Z"
 *         opportunity:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             title:
 *               type: string
 *               example: "Weekend food bank shift"
 *             center:
 *               type: string
 *               example: "Downtown"
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2026-07-15T14:30:00.000Z"
 *
 *     Volunteer:
 *       type: object
 *       description: >
 *         A volunteer record. The password is never returned. The `matches` array
 *         is returned by the single-volunteer endpoint only, not the list.
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: "Jane"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         username:
 *           type: string
 *           example: "jdoe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         address:
 *           type: string
 *           nullable: true
 *           example: "123 Main St, Jacksonville, FL"
 *         homePhone:
 *           type: string
 *           nullable: true
 *           example: "904-555-0100"
 *         workPhone:
 *           type: string
 *           nullable: true
 *           example: "904-555-0101"
 *         cellPhone:
 *           type: string
 *           nullable: true
 *           example: "904-555-0102"
 *         educationalBackground:
 *           type: string
 *           nullable: true
 *           example: "B.S. Nursing, UNF"
 *         currentLicenses:
 *           type: string
 *           nullable: true
 *           example: "RN (FL), CPR certified"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["tutoring", "food service"]
 *         preferredCenters:
 *           type: array
 *           items:
 *             type: string
 *           description: Free-text center names where the volunteer prefers to work
 *           example: ["Downtown", "Northside"]
 *         availability:
 *           type: string
 *           nullable: true
 *           example: "Weekday evenings, Saturday mornings"
 *         emergencyName:
 *           type: string
 *           nullable: true
 *           example: "John Doe"
 *         emergencyHomePhone:
 *           type: string
 *           nullable: true
 *           example: "904-555-0200"
 *         emergencyWorkPhone:
 *           type: string
 *           nullable: true
 *           example: "904-555-0201"
 *         emergencyEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: "john.doe@example.com"
 *         emergencyAddress:
 *           type: string
 *           nullable: true
 *           example: "123 Main St, Jacksonville, FL"
 *         driversLicenseOnFile:
 *           type: boolean
 *           example: false
 *         socialSecurityOnFile:
 *           type: boolean
 *           example: false
 *         approvalStatus:
 *           $ref: '#/components/schemas/ApprovalStatus'
 *         matches:
 *           type: array
 *           description: Opportunities this volunteer is assigned to.
 *           items:
 *             $ref: '#/components/schemas/VolunteerMatch'
 *
 *     VolunteerSummary:
 *       type: object
 *       description: The condensed volunteer shape returned by the list view.
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: "Jane"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         approvalStatus:
 *           $ref: '#/components/schemas/ApprovalStatus'
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 25
 *         total:
 *           type: integer
 *           description: Total number of records matching the filter and search
 *           example: 42
 *         totalPages:
 *           type: integer
 *           example: 2
 *
 *     VolunteerListResponse:
 *       type: object
 *       description: >
 *         A page of volunteers. An empty `data` array means nothing matched —
 *         that is a successful response, not a 404.
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VolunteerSummary'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     VolunteerCreateRequest:
 *       type: object
 *       required: [firstName, lastName, username, password, email]
 *       description: >
 *         Fields for creating a volunteer. Optional string fields are trimmed;
 *         email addresses are lowercased. Approval status may be supplied; if
 *         omitted it defaults to PENDING.
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Jane"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         username:
 *           type: string
 *           example: "jdoe"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "correcthorsebatterystaple"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         address:
 *           type: string
 *           example: "123 Main St, Jacksonville, FL"
 *         homePhone:
 *           type: string
 *           example: "904-555-0100"
 *         workPhone:
 *           type: string
 *           example: "904-555-0101"
 *         cellPhone:
 *           type: string
 *           example: "904-555-0102"
 *         educationalBackground:
 *           type: string
 *           example: "B.S. Nursing, UNF"
 *         currentLicenses:
 *           type: string
 *           example: "RN (FL), CPR certified"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           default: []
 *           example: ["tutoring", "food service"]
 *         preferredCenters:
 *           type: array
 *           items:
 *             type: string
 *           default: []
 *           description: Optional on creation; typically added later via update.
 *           example: ["Downtown", "Northside"]
 *         availability:
 *           type: string
 *           example: "Weekday evenings, Saturday mornings"
 *         emergencyName:
 *           type: string
 *           example: "John Doe"
 *         emergencyHomePhone:
 *           type: string
 *           example: "904-555-0200"
 *         emergencyWorkPhone:
 *           type: string
 *           example: "904-555-0201"
 *         emergencyEmail:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         emergencyAddress:
 *           type: string
 *           example: "123 Main St, Jacksonville, FL"
 *         driversLicenseOnFile:
 *           type: boolean
 *           default: false
 *         socialSecurityOnFile:
 *           type: boolean
 *           default: false
 *         approvalStatus:
 *           allOf:
 *             - $ref: '#/components/schemas/ApprovalStatus'
 *           default: "PENDING"
 *           description: Defaults to PENDING when omitted.
 *
 *     VolunteerUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update — send only the fields you want to change. Omitted fields
 *         are left untouched. Required fields may be omitted, but cannot be set to
 *         an empty value. Supplying a password re-hashes it. Sending an empty array
 *         for skills or preferredCenters clears them.
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Janet"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         username:
 *           type: string
 *           example: "jdoe"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "anewpasswordhere"
 *         email:
 *           type: string
 *           format: email
 *           example: "janet.doe@example.com"
 *         address:
 *           type: string
 *           nullable: true
 *           example: "456 Oak Ave, Jacksonville, FL"
 *         homePhone:
 *           type: string
 *           nullable: true
 *         workPhone:
 *           type: string
 *           nullable: true
 *         cellPhone:
 *           type: string
 *           nullable: true
 *         educationalBackground:
 *           type: string
 *           nullable: true
 *         currentLicenses:
 *           type: string
 *           nullable: true
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["tutoring", "driving"]
 *         preferredCenters:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Downtown"]
 *         availability:
 *           type: string
 *           nullable: true
 *         emergencyName:
 *           type: string
 *           nullable: true
 *         emergencyHomePhone:
 *           type: string
 *           nullable: true
 *         emergencyWorkPhone:
 *           type: string
 *           nullable: true
 *         emergencyEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *         emergencyAddress:
 *           type: string
 *           nullable: true
 *         driversLicenseOnFile:
 *           type: boolean
 *         socialSecurityOnFile:
 *           type: boolean
 *         approvalStatus:
 *           $ref: '#/components/schemas/ApprovalStatus'
 *
 *     OpportunityMatch:
 *       type: object
 *       description: A volunteer assigned to an opportunity.
 *       properties:
 *         matchedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-15T14:30:00.000Z"
 *         volunteer:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             firstName:
 *               type: string
 *               example: "Jane"
 *             lastName:
 *               type: string
 *               example: "Doe"
 *             email:
 *               type: string
 *               format: email
 *               example: "jane.doe@example.com"
 *
 *     Opportunity:
 *       type: object
 *       description: >
 *         A volunteer opportunity offered at a center. The `matches` array is
 *         returned by the single-opportunity and assignment endpoints, but not
 *         by the list endpoint.
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Weekend food bank shift"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Sorting and packing donations, 9am-1pm"
 *         center:
 *           type: string
 *           description: Free-text center name
 *           example: "Downtown"
 *         matches:
 *           type: array
 *           description: Volunteers assigned to this opportunity.
 *           items:
 *             $ref: '#/components/schemas/OpportunityMatch'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-15T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-15T14:30:00.000Z"
 *
 *     OpportunityListResponse:
 *       type: object
 *       description: >
 *         A page of opportunities. An empty `data` array means nothing matched —
 *         that is a successful response, not a 404.
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Opportunity'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     OpportunityCreateRequest:
 *       type: object
 *       required: [title, center]
 *       description: >
 *         Fields for creating an opportunity. Optional string fields are trimmed.
 *       properties:
 *         title:
 *           type: string
 *           example: "Weekend food bank shift"
 *         description:
 *           type: string
 *           example: "Sorting and packing donations, 9am-1pm"
 *         center:
 *           type: string
 *           example: "Downtown"
 *
 *     OpportunityUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update — send only the fields you want to change. Omitted fields
 *         are left untouched. Required fields may be omitted, but cannot be set to
 *         an empty value. Volunteer assignments are managed separately via
 *         PUT /opportunities/{id}/volunteers.
 *       properties:
 *         title:
 *           type: string
 *           example: "Weekday food bank shift"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Sorting and packing donations, 1pm-5pm"
 *         center:
 *           type: string
 *           example: "Northside"
 *
 *     AssignVolunteersRequest:
 *       type: object
 *       required: [volunteerEmails]
 *       description: >
 *         Replaces the opportunity's assignment list. Every email must belong to
 *         an existing volunteer or the whole request is rejected. Sending an empty
 *         array clears all assignments.
 *       properties:
 *         volunteerEmails:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           example: ["jane.doe@example.com", "john.smith@example.com"]
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *         message:
 *           type: string
 *     BadRequestError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 400
 *         message: "username: must be at least 3 characters"
 *     UnauthorizedError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 401
 *         message: "Invalid username or password"
 *     NotFoundError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 404
 *         message: "Record not found"
 *     ConflictError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 409
 *         message: "That username is already in use"
 *     ServerError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 500
 *         message: "An error occurred"
 */

export {};
