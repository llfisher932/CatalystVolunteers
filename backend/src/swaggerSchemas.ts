/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *     RegisterRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "correcthorsebatterystaple"
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "correcthorsebatterystaple"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT bearer token, valid for 60 minutes
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *         message: "A valid email is required"
 *     UnauthorizedError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 401
 *         message: "Invalid email or password"
 *     ConflictError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 409
 *         message: "Email already registered"
 *     ServerError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *       example:
 *         status: 500
 *         message: "An error occurred"
 */
