import express from "express";
import { addLocation, getAllLocationRequests, getAllLocations, updateLocationRequestStatus } from "../controller/locationController.js";
import { isPackageManagerAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/addnew", isPackageManagerAuthenticated, addLocation);
router.get("/all", isPackageManagerAuthenticated, getAllLocations);

router.get('/location-requests', getAllLocationRequests);
router.put('/location-requests/:id/status', isPackageManagerAuthenticated, updateLocationRequestStatus);


export default router;