import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clearSelectedProduct, fetchProductByIdAsync,resetProductUpdateStatus, selectProductFetchStatus, selectProductUpdateStatus, selectSelectedProduct, updateProductByIdAsync } from '../../products/ProductSlice'
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useForm } from "react-hook-form"
import { selectBrands } from '../../brands/BrandSlice'
import { selectCategories } from '../../categories/CategoriesSlice'
import { toast } from 'react-toastify'

export const ProductUpdate = () => {

    const {register,handleSubmit,watch,formState: { errors }} = useForm()

    const {id}=useParams()
    const dispatch=useDispatch()
    const selectedProduct=useSelector(selectSelectedProduct)
    const brands=useSelector(selectBrands)
    const categories=useSelector(selectCategories)
    const productUpdateStatus=useSelector(selectProductUpdateStatus)
    const productFetchStatus=useSelector(selectProductFetchStatus)
    const navigate=useNavigate()
    const theme=useTheme()
    const is1100=useMediaQuery(theme.breakpoints.down(1100))
    const is480=useMediaQuery(theme.breakpoints.down(480))


    useEffect(()=>{
        if(id){
            dispatch(fetchProductByIdAsync(id))
        }
    },[id])

    const productErrors = useSelector(state => state.ProductSlice.errors);
    
    useEffect(()=>{
        if(productUpdateStatus==='fulfilled'){
            toast.success("Product Updated Successfully!")
            navigate("/admin/dashboard")
        }
        else if(productUpdateStatus==='rejected'){
            const errorMessage = productErrors?.message || "Error updating product, please try again later";
            toast.error(errorMessage);
            console.error('Product update error:', productErrors);
        }
    },[productUpdateStatus, productErrors])

    useEffect(()=>{
        return ()=>{
            dispatch(clearSelectedProduct())
            dispatch(resetProductUpdateStatus())
        }
    },[])

    const handleProductUpdate=(data)=>{
        console.log('Raw form data:', data);
        console.log('Selected product:', selectedProduct);
        
        // Convert string values to appropriate types
        const processedData = {
            ...data,
            price: parseFloat(data.price),
            discountPercentage: parseFloat(data.discountPercentage),
            stockQuantity: parseInt(data.stockQuantity, 10)
        };
        
        const productUpdate={
            ...processedData,
            _id:selectedProduct._id,
            images:[data?.image0,data?.image1,data?.image2,data?.image3].filter(img => img) // Remove empty images
        }
        
        // Remove image fields from the main object
        delete productUpdate?.image0
        delete productUpdate?.image1
        delete productUpdate?.image2
        delete productUpdate?.image3

        console.log('Product update data being sent:', productUpdate);
        dispatch(updateProductByIdAsync(productUpdate))
    }


  return (
    <Stack p={'0 16px'} justifyContent={'center'} alignItems={'center'} flexDirection={'row'} >
        {
            productFetchStatus === 'pending' ? (
                <Stack height="50vh" justifyContent="center" alignItems="center">
                    <CircularProgress />
                    <Typography mt={2}>Loading product details...</Typography>
                </Stack>
            ) : productFetchStatus === 'rejected' ? (
                <Stack height="50vh" justifyContent="center" alignItems="center">
                    <Typography color="error">Error loading product details</Typography>
                    <Button component={Link} to="/admin/dashboard" sx={{ mt: 2 }}>
                        Back to Dashboard
                    </Button>
                </Stack>
            ) : selectedProduct ? (
                <Stack width={is1100?"100%":"60rem"} rowGap={4} mt={is480?4:6} mb={6} component={'form'} noValidate onSubmit={handleSubmit(handleProductUpdate)}> 
                    
                    {/* feild area */}
                    <Stack rowGap={3}>
                        <Stack>
                            <Typography variant='h6' fontWeight={400} gutterBottom>Title</Typography>
                            <TextField defaultValue={selectedProduct.title} {...register("title",{required:'Title is required'})}/>
                        </Stack> 

                        <Stack flexDirection={'row'} >

                            <FormControl fullWidth>
                                <InputLabel id="brand-selection">Brand</InputLabel>
                                <Select defaultValue={selectedProduct.brand._id} {...register("brand",{required:"Brand is required"})} labelId="brand-selection" label="Brand">
                                    
                                    {
                                        Array.isArray(brands) && brands.map((brand)=>(
                                            <MenuItem key={brand._id} value={brand._id}>{brand.name}</MenuItem>
                                        ))
                                    }

                                </Select>
                            </FormControl>


                            <FormControl fullWidth>
                                <InputLabel id="category-selection">Category</InputLabel>
                                <Select defaultValue={selectedProduct.category._id} {...register("category",{required:"category is required"})} labelId="category-selection" label="Category">
                                    
                                    {
                                        Array.isArray(categories) && categories.map((category)=>(
                                            <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>
                                        ))
                                    }

                                </Select>
                            </FormControl>

                        </Stack>


                        <Stack>
                            <Typography variant='h6' fontWeight={400}  gutterBottom>Description</Typography>
                            <TextField defaultValue={selectedProduct.description} multiline rows={4} {...register("description",{required:"Description is required"})}/>
                        </Stack>

                        <Stack flexDirection={'row'}>
                            <Stack flex={1}>
                                <Typography variant='h6' fontWeight={400}  gutterBottom>Price</Typography>
                                <TextField defaultValue={selectedProduct.price} type='number' {...register("price",{required:"Price is required"})}/>
                            </Stack>
                            <Stack flex={1}>
                                <Typography variant='h6' fontWeight={400}  gutterBottom>Discount {is480?"%":"Percentage"}</Typography>
                                <TextField defaultValue={selectedProduct.discountPercentage} type='number' {...register("discountPercentage",{required:"discount percentage is required"})}/>
                            </Stack>
                        </Stack>

                        <Stack>
                            <Typography variant='h6'  fontWeight={400} gutterBottom>Stock Quantity</Typography>
                            <TextField defaultValue={selectedProduct.stockQuantity} type='number' {...register("stockQuantity",{required:"Stock Quantity is required"})}/>
                        </Stack>
                        <Stack>
                            <Typography variant='h6'  fontWeight={400} gutterBottom>Thumbnail</Typography>
                            <TextField defaultValue={selectedProduct.thumbnail} {...register("thumbnail",{required:"Thumbnail is required"})}/>
                        </Stack>

                        <Stack>
                            <Typography variant='h6'  fontWeight={400} gutterBottom>Product Images</Typography>

                            <Stack rowGap={2}>
                                {
                                    selectedProduct.images.map((image,index)=>(
                                        <TextField key={index} defaultValue={image} {...register(`image${index}`,{required:"Image is required"})}/>
                                    ))
                                }
                            </Stack>

                        </Stack>

                    </Stack>


                    {/* action area */}
                    <Stack flexDirection={'row'} alignSelf={'flex-end'} columnGap={is480?1:2}>
                        <Button size={is480?'medium':'large'} variant='contained' type='submit'>Update</Button>
                        <Button size={is480?'medium':'large'} variant='outlined' color='error' component={Link} to={'/admin/dashboard'}>Cancel</Button>
                    </Stack>

                </Stack>
            ) : (
                <Stack height="50vh" justifyContent="center" alignItems="center">
                    <Typography>No product found</Typography>
                    <Button component={Link} to="/admin/dashboard" sx={{ mt: 2 }}>
                        Back to Dashboard
                    </Button>
                </Stack>
            )
        }
    </Stack>
  )
}
