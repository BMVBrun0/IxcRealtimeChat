import { Router } from "express";
import { getMessages } from "../controllers/message.controller";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/:userId", authenticate, asyncHandler(getMessages));

export const messageRoutes = router;
