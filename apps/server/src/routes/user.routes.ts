import { Router } from "express";
import { listUsers, updateProfileAvatarController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authenticate";
import { uploadAvatar } from "../middlewares/upload-avatar";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/", authenticate, asyncHandler(listUsers));
router.post(
  "/profile/avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  asyncHandler(updateProfileAvatarController)
);

export const userRoutes = router;
