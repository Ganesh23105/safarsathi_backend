import express from "express";
import { login, customerRegister, customerLogout, getUserDetails, addEmployee, employeeLogout, employee_serviceProvider_Logout } from "../controller/userController.js";
import { isCustomerAuthenticated, isEmployeeAuthenticated, isEmployeeServiceProviderAuthenticated, isPackageManagerAuthenticated, isProviderVerifierAuthenticated, isServiceProviderAuthenticated } from "../middlewares/auth.js";
import { createServiceProviderRequest, getServiceProviderRequests, getServiceProviders, registerServiceProvider, serviceProviderLogout, updateOrganizationImage} from "../controller/serviceProviderController.js"
import { addLocationRequest } from "../controller/locationController.js";
import { sendVerificationOtp } from "../controller/emailController.js";
import { generateOtp } from "../middlewares/generateOtp.js";

const router = express.Router();

router.post("/login", login)


router.post("/customer/register", customerRegister)
router.get("/customer/me", isCustomerAuthenticated, getUserDetails)
router.get("/customer/logout", isCustomerAuthenticated, customerLogout)
router.post("/customer/register/otp", generateOtp, sendVerificationOtp)

router.post('/employee/add', isProviderVerifierAuthenticated, addEmployee);
// router.get("/employee/providerverifier/logout", isProviderVerifierAuthenticated, provider_verifierLogout)
// router.get("/employee/packagemanager/logout", isPackageManagerAuthenticated, package_managerLogout)
router.get("/employee/logout", isEmployeeAuthenticated, employeeLogout);
router.get("/employee/me", isEmployeeAuthenticated, getUserDetails);
router.post("/employee/addserviceprovider", isProviderVerifierAuthenticated, registerServiceProvider);

router.get("/employee_serviceprovider/me", isEmployeeServiceProviderAuthenticated, getUserDetails);
router.get("/employee_serviceprovider/logout", isEmployeeServiceProviderAuthenticated, employee_serviceProvider_Logout);

router.get("/serviceprovider/find", getServiceProviders);
router.get("/serviceprovider/logout", isServiceProviderAuthenticated, serviceProviderLogout);
router.post('/serviceprovider/request', isServiceProviderAuthenticated, createServiceProviderRequest);
router.get("/serviceprovider/getallrequest", isServiceProviderAuthenticated, getServiceProviderRequests);
router.put('/service-provider/:serviceProviderId/update-organization-image', isServiceProviderAuthenticated,updateOrganizationImage);

router.post('/customer/addLocationRequest', isCustomerAuthenticated, addLocationRequest);

export default router;
