import swaggerJsdoc from "swagger-jsdoc";
const PORT = process.env.PORT ?? 3000;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Catalyst Volunteers API",
      version: "1.0.0",
      description: "API for managing volunteers and opportunities",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routers/*.ts", "./src/swaggerSchemas.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
