import express from "express";
import { chat, chatPublic } from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/ask", chat);
router.post("/public-ask", chatPublic);

export default router;
