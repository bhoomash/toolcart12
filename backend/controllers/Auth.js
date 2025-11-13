const User = require("../models/User");
const bcrypt=require('bcryptjs');
const { sendMail } = require("../utils/Emails");
const { generateOTP } = require("../utils/GenerateOtp");
const Otp = require("../models/OTP");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { generateToken } = require("../utils/GenerateToken");
const PasswordResetToken = require("../models/PasswordResetToken");
const { AppError, asyncErrorHandler } = require('../middleware/ErrorHandler');
const { sendAuthSuccess, sendSuccess } = require('../utils/ResponseFormatter');

exports.signup = asyncErrorHandler(async(req,res,next) => {
        const existingUser=await User.findOne({email:req.body.email})
        
        // if user already exists
        if(existingUser){
            throw new AppError("User already exists", 409, 'CONFLICT_ERROR');
        }

        // Remove confirmPassword field as it's not needed in the database
        delete req.body.confirmPassword

        // hashing the password
        const hashedPassword=await bcrypt.hash(req.body.password,10)
        req.body.password=hashedPassword

        // creating new user
        const createdUser=new User(req.body)
        await createdUser.save()

        // Generate and send OTP for email verification
        const otp = generateOTP()
        const hashedOtp = await bcrypt.hash(otp, 10)

        // Save OTP to database
        const newOtp = new Otp({
            user: createdUser._id,
            otp: hashedOtp,
            expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME)
        })
        await newOtp.save()

        // Send OTP email
        await sendMail(
            createdUser.email,
            `Email Verification for Your ToolCart Account`,
            `Welcome to ToolCart! Your One-Time Password (OTP) for email verification is: <b>${otp}</b>.<br/>This OTP will expire in 2 minutes. Do not share this OTP with anyone for security reasons.`
        )

        // Return user info WITHOUT JWT token - user must verify OTP first
        return sendSuccess(
            res, 
            { 
                user: sanitizeUser(createdUser),
                requiresVerification: true 
            }, 
            "Account created successfully! Please check your email for the verification OTP.", 
            201
        );
    });

exports.login = asyncErrorHandler(async(req,res,next) => {
    // checking if user exists or not
    const existingUser=await User.findOne({email:req.body.email})

    // if exists and password matches the hash
    if(existingUser && (await bcrypt.compare(req.body.password,existingUser.password))){

        // getting secure user info
        const secureInfo=sanitizeUser(existingUser)

        // generating jwt token
        const token=generateToken(secureInfo)

        // sending jwt token in the response cookies
        res.cookie('token',token,{
            sameSite:process.env.PRODUCTION==='true'?"None":'Lax',
            maxAge:new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000))),
            httpOnly:true,
            secure:process.env.PRODUCTION==='true'?true:false
        })
        return sendAuthSuccess(res, sanitizeUser(existingUser), "Login successful");
    }

    res.clearCookie('token');
    throw new AppError("Invalid Credentials", 401, 'AUTHENTICATION_ERROR');
});

exports.verifyOtp = asyncErrorHandler(async(req,res,next) => {
    // checks if user id is existing in the user collection
    const isValidUserId = await User.findById(req.body.userId)

    // if user id does not exists then returns a 404 response
    if(!isValidUserId){
        throw new AppError('User not Found, for which the otp has been generated', 404, 'USER_NOT_FOUND');
    }

    // checks if otp exists by that user id
    const isOtpExisting = await Otp.findOne({user:isValidUserId._id})

    // if otp does not exists then returns a 404 response
    if(!isOtpExisting){
        throw new AppError('Otp not found', 404, 'OTP_NOT_FOUND');
    }

    // checks if the otp is expired, if yes then deletes the otp and returns response accordinly
    if(isOtpExisting.expiresAt < new Date()){
        await Otp.findByIdAndDelete(isOtpExisting._id)
        throw new AppError("Otp has been expired", 400, 'OTP_EXPIRED');
    }
    
    // checks if otp is there and matches the hash value then updates the user verified status to true and returns the updated user
    if(isOtpExisting && (await bcrypt.compare(req.body.otp,isOtpExisting.otp))){
        await Otp.findByIdAndDelete(isOtpExisting._id)
        const verifiedUser = await User.findByIdAndUpdate(isValidUserId._id,{isVerified:true},{new:true})
        
        // Generate JWT token after successful verification
        const secureInfo = sanitizeUser(verifiedUser)
        const token = generateToken(secureInfo)

        // Set JWT token in response cookies
        res.cookie('token', token, {
            sameSite: process.env.PRODUCTION === 'true' ? "None" : 'Lax',
            maxAge: new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000))),
            httpOnly: true,
            secure: process.env.PRODUCTION === 'true' ? true : false
        })

        return sendAuthSuccess(res, sanitizeUser(verifiedUser), "Email verified successfully! Welcome to ToolCart!");
    }

    // in default case if none of the conidtion matches, then return this response
    throw new AppError('Otp is invalid or expired', 400, 'INVALID_OTP');
});

exports.resendOtp = asyncErrorHandler(async(req,res,next) => {
    const existingUser = await User.findById(req.body.user)

    if(!existingUser){
        throw new AppError("User not found", 404, 'USER_NOT_FOUND');
    }

    await Otp.deleteMany({user:existingUser._id})

    const otp = generateOTP()
    const hashedOtp = await bcrypt.hash(otp,10)

    const newOtp = new Otp({user:req.body.user,otp:hashedOtp,expiresAt:Date.now()+parseInt(process.env.OTP_EXPIRATION_TIME)})
    await newOtp.save()

    await sendMail(existingUser.email,`Email Verification for Your MERN E-Commerce Account`,`Your One-Time Password (OTP) for account verification is: <b>${otp}</b>.<br/>This OTP will expire in 2 minutes. Do not share this OTP with anyone for security reasons.`)

    res.status(201).json({'message':"OTP sent"})
});

exports.forgotPassword = asyncErrorHandler(async(req,res,next) => {
    // checks if user provided email exists or not
    const isExistingUser = await User.findOne({email:req.body.email})

    // if email does not exists returns a 404 response
    if(!isExistingUser){
        throw new AppError("Provided email does not exists", 404, 'USER_NOT_FOUND');
    }

    await PasswordResetToken.deleteMany({user:isExistingUser._id})

    // if user exists , generates a password reset token
    const passwordResetToken = generateToken(sanitizeUser(isExistingUser),true)

    // hashes the token
    const hashedToken = await bcrypt.hash(passwordResetToken,10)

    // saves hashed token in passwordResetToken collection
    const newToken = new PasswordResetToken({user:isExistingUser._id,token:hashedToken,expiresAt:Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME)})
    await newToken.save()

    // sends the password reset link to the user's mail
    await sendMail(isExistingUser.email,'Password Reset Link for Your ToolCart Account',`<p>Dear ${isExistingUser.name},

    We received a request to reset the password for your ToolCart account. If you initiated this request, please use the following link to reset your password:</p>
    
    <p><a href=${process.env.ORIGIN}/reset-password/${isExistingUser._id}/${passwordResetToken} target="_blank">Reset Password</a></p>
    
    <p>This link is valid for 2 minutes. If you did not request a password reset, please ignore this email. Your account security is important to us.
    
    Thank you,<br/>
    The MERN E-Commerce Team</p>`)

    res.status(200).json({message:`Password Reset link sent to ${isExistingUser.email}`})
});

exports.resetPassword = asyncErrorHandler(async(req,res,next) => {
    // checks if user exists or not
    const isExistingUser = await User.findById(req.body.userId)

    // if user does not exists then returns a 404 response
    if(!isExistingUser){
        throw new AppError("User does not exists", 404, 'USER_NOT_FOUND');
    }

    // fetches the resetPassword token by the userId
    const isResetTokenExisting = await PasswordResetToken.findOne({user:isExistingUser._id})

    // If token does not exists for that userid, then returns a 404 response
    if(!isResetTokenExisting){
        throw new AppError("Reset Link is Not Valid", 404, 'INVALID_TOKEN');
    }

    // if the token has expired then deletes the token, and send response accordingly
    if(isResetTokenExisting.expiresAt < new Date()){
        await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id)
        throw new AppError("Reset Link has been expired", 400, 'TOKEN_EXPIRED');
    }

    // if token exists and is not expired and token matches the hash, then resets the user password and deletes the token
    if(isResetTokenExisting && isResetTokenExisting.expiresAt>new Date() && (await bcrypt.compare(req.body.token,isResetTokenExisting.token))){
        // deleting the password reset token
        await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id)

        // resets the password after hashing it
        await User.findByIdAndUpdate(isExistingUser._id,{password:await bcrypt.hash(req.body.password,10)})
        return res.status(200).json({message:"Password Updated Successfuly"})
    }

    throw new AppError("Reset Link has been expired", 400, 'TOKEN_EXPIRED');
});

exports.logout = asyncErrorHandler(async(req,res,next) => {
    res.cookie('token',{
        maxAge:0,
        sameSite:process.env.PRODUCTION==='true'?"None":'Lax',
        httpOnly:true,
        secure:process.env.PRODUCTION==='true'?true:false
    })
    res.status(200).json({message:'Logout successful'})
});

exports.checkAuth = asyncErrorHandler(async(req,res,next) => {
    if(req.user){
        const user = await User.findById(req.user._id)
        return res.status(200).json(sanitizeUser(user))
    }
    res.sendStatus(401)
});