import { Router } from "express";
import {
  login,
  signup,
  checkUserNameAndPwd,
  logoutAll,
  refresh,
} from "./../controllers/authControllers";
import protect from "../helpers/protect";

const router = Router();

router.route("/login").post(checkUserNameAndPwd, login);
router.route("/signup").post(checkUserNameAndPwd, signup);
router.route("/logout-all").post(protect, logoutAll);
router.route("/refresh").post(protect, refresh);

export default router;
