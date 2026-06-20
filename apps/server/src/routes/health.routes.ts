import { Router } from "express";
import { health } from "../controllers/health.controller";

const router = Router();

router.get("/", health);

export const healthRoutes = router;
