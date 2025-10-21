import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Auth API",
            version: "1.0.0",
            description: "User authentication API (register, login, refresh)",
        },
    },
    apis: [join(__dirname, "./routes/**/*.{js,ts,yaml}")],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
