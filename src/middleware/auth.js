import jwt from "jsonwebtoken";
import { ERROR_TYPE } from "../enums/error.enum.js";
const ACCESS_SECRET = process.env.ACCESS_SECRET || "accesssecret";

export function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];
    if (!header) return res.status(401).send({
        error: {
            code: ERROR_TYPE.UN_AUTHORIZATION,
            message: "User unauthorization"
        }
    });

    const token = header.split(" ")[1] || "";
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(403).send({
            error: {
                code: ERROR_TYPE.UN_AUTHORIZATION,
                message: "User unauthorization"
            }
        });
    }
}
