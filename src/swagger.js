import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0", info: {
            title: "IELTS JS API",
            version: "1.3.0",
            description: "User authentication API with JWT Bearer token support",
        }, servers: [{
            url: "http://localhost:3000", description: "Development server",
        }, {
            url: "https://ielts-js.onrender.com", description: "Production server",
        },], components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token (access_token from /auth/login)",
                },
            },
        }, security: [{
            bearerAuth: [],
        },],
    }, apis: [join(__dirname, "./routes/**/*.{js,ts,yaml}")],
};

export const swaggerSpec = swaggerJsdoc(options);
export {swaggerUi};