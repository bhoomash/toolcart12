const Category=require("../models/Category")
const { asyncErrorHandler, AppError } = require('../middleware/ErrorHandler');
const { sendSuccess } = require('../utils/ResponseFormatter');

exports.getAll = asyncErrorHandler(async(req,res,next) => {
    const result = await Category.find({})
    return sendSuccess(res, result, 'Categories retrieved successfully');
});