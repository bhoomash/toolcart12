const User=require("../models/User")
const { asyncErrorHandler, AppError } = require('../middleware/ErrorHandler');
const { sendSuccess, sendNotFound } = require('../utils/ResponseFormatter');

exports.getById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const result = await User.findById(id)
    
    if(!result) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const userObject = result.toObject()
    delete userObject.password
    return sendSuccess(res, userObject, 'User retrieved successfully');
});

exports.updateById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const updated = await User.findByIdAndUpdate(id,req.body,{new:true})
    
    if(!updated) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const userObject = updated.toObject()
    delete userObject.password
    return sendSuccess(res, userObject, 'User updated successfully');
});