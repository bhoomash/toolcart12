const Order = require("../models/Order");
const { asyncErrorHandler, AppError } = require('../middleware/ErrorHandler');

exports.create = asyncErrorHandler(async(req,res,next) => {
    console.log('Creating order with data:', req.body);
    const created = new Order(req.body)
    await created.save()
    console.log('Order created successfully:', created);
    res.status(201).json(created)
});

exports.getByUserId = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const results = await Order.find({user:id})
    res.status(200).json(results)
});

exports.getAll = asyncErrorHandler(async(req,res,next) => {
    let skip=0
    let limit=0

    if(req.query.page && req.query.limit){
        const pageSize=req.query.limit
        const page=req.query.page
        skip=pageSize*(page-1)
        limit=pageSize
    }

    const totalDocs=await Order.find({}).countDocuments().exec()
    const results=await Order.find({}).skip(skip).limit(limit).exec()

    res.header("X-Total-Count",totalDocs)
    res.status(200).json(results)
});

exports.updateById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const updated = await Order.findByIdAndUpdate(id,req.body,{new:true})
    
    if(!updated) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    res.status(200).json(updated)
});
