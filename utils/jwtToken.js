export const generateToken = (user, message, statusCode, res) => {
    // Generate the token
    const token = user.generateJsonWebToken();

    // Convert the Mongoose document into a plain JavaScript object
    user = user.toObject();

    // Remove the password from the user object
    delete user.password;

    // Set cookieName based on the role
    let cookieName;
    if (user.role === 'customer') {
        cookieName = "customerToken";
    } else if (user.role === 'service_provider') {
        cookieName = "serviceProviderToken";
    } else if (user.role === 'employee' && user.verificationRole === 'package_manager') {
        cookieName = "package_managerToken";
    } else if (user.role === 'employee' && user.verificationRole === 'provider_verifier') {
        cookieName = "provider_verifierToken";
    } 
    // else {
    //     cookieName = "genericToken"; // Fallback for any other roles
    // }

    // Send the response with the token and user details (without password)
    res.status(statusCode).cookie(cookieName, token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }).json({
        success: true,
        message,
        user,
        token
    });
}
