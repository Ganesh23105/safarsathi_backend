import express from "express";
import { isPackageManagerAuthenticated } from "../middlewares/auth.js";
import { createNewPackage, getAllPackages, getPackageDetails, practiceCreateNewPackage, practicePackageImgUploader } from "../controller/packageController.js";

const router = express.Router();

router.post("/addnew", isPackageManagerAuthenticated, createNewPackage);
router.get("/all", getAllPackages);
router.get("/:id", getPackageDetails);

router.post("/practicePackageImgUploader", practicePackageImgUploader);
router.post("/practiceCreateNewPackage", isPackageManagerAuthenticated, practiceCreateNewPackage);

export default router;