import express from "express";
import { isCustomerAuthenticated } from "../middlewares/auth.js";
import { createBooking } from "../controller/bookingController.js";

const router = express.Router();

router.post("/", isCustomerAuthenticated, createBooking);
// router.get("/all", isPackageManagerAuthenticated, getAllLocations);

export default router;