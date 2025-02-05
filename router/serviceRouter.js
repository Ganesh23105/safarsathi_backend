import express from "express";
import { isPackageManagerAuthenticated } from "../middlewares/auth.js";
import { getAllServiceProviderRequests, updateServiceProviderRequestStatus } from "../controller/serviceController.js";

const router = express.Router();

router.get('/all', isPackageManagerAuthenticated, getAllServiceProviderRequests);
// Update service provider request status
router.put('/request/:requestId/status', isPackageManagerAuthenticated, updateServiceProviderRequestStatus);

export default router;