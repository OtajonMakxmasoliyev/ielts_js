import jwt from "jsonwebtoken";
import { IUser } from "../models/User.js";
import { NextFunction, Request, Response } from "express";
const ACCESS_SECRET = process.env.ACCESS_SECRET || "accesssecret";

export function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];
    if (!header) return res.status(401).send("No token");

    const token = header.split(" ")[1] || "";
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(403).send("Invalid token");
    }
}
