import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateBody } from "../middlewares/validate-body";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), login);
router.get("/me", authenticate, asyncHandler(me));
router.post("/logout", authenticate, asyncHandler(logout));

export const authRoutes = router;
