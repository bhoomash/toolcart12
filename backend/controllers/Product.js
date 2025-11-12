const { Schema, default: mongoose } = require("mongoose")
const Product=require("../models/Product")
const { asyncErrorHandler, AppError } = require('../middleware/ErrorHandler');

exports.create = asyncErrorHandler(async(req,res,next) => {
    const created = new Product(req.body)
    await created.save()
    res.status(201).json(created)
});

exports.getAll = asyncErrorHandler(async(req,res,next) => {
    const filter={}
        // Removed sort logic
    let skip=0
    let limit=0

    if(req.query.brand){
        filter.brand={$in:req.query.brand}
    }

    if(req.query.category){
        filter.category={$in:req.query.category}
    }

    if(req.query.search){
        filter.$or=[
            {title:{$regex:req.query.search,$options:'i'}},
            {description:{$regex:req.query.search,$options:'i'}}
        ]
    }

    if(req.query.user){
        filter['isDeleted']=false
    }

        // Sort logic removed

    if(req.query.page && req.query.limit){

        const pageSize=req.query.limit
        const page=req.query.page

        skip=pageSize*(page-1)
        limit=pageSize
    }

        const totalDocs=await Product.find(filter).populate("brand").countDocuments().exec()
        const results=await Product.find(filter).populate("brand").skip(skip).limit(limit).exec()

    res.set("X-Total-Count",totalDocs)

    res.status(200).json(results)
});

exports.getById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const result = await Product.findById(id).populate("brand").populate("category")
    
    if(!result) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    res.status(200).json(result)
});

exports.updateById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    console.log('Updating product with ID:', id);
    console.log('Update data received:', req.body);
    
    const updated = await Product.findByIdAndUpdate(id,req.body,{new:true})
    
    if(!updated) {
        console.log('Product not found for ID:', id);
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    console.log('Product updated successfully:', updated);
    res.status(200).json(updated)
});

exports.undeleteById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const unDeleted = await Product.findByIdAndUpdate(id,{isDeleted:false},{new:true}).populate('brand')
    
    if(!unDeleted) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    res.status(200).json(unDeleted)
});

exports.deleteById = asyncErrorHandler(async(req,res,next) => {
    const {id} = req.params
    const deleted = await Product.findByIdAndUpdate(id,{isDeleted:true},{new:true}).populate("brand")
    
    if(!deleted) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    res.status(200).json(deleted)
});


