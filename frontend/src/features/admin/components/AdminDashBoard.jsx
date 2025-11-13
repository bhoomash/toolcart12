import { Button, Grid, IconButton, Pagination, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import { selectBrands } from '../../brands/BrandSlice'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { selectCategories } from '../../categories/CategoriesSlice'
import { ProductCard } from '../../products/components/ProductCard'
import { deleteProductByIdAsync, fetchProductsAsync, selectProductIsFilterOpen, selectProductStatus, selectProductTotalResults, selectProducts, toggleFilters, undeleteProductByIdAsync } from '../../products/ProductSlice';
import { Link } from 'react-router-dom';
import {motion} from 'framer-motion'
import ClearIcon from '@mui/icons-material/Clear';
import { ITEMS_PER_PAGE } from '../../../constants';
import { toast } from 'react-toastify';

export const AdminDashBoard = () => {

    const [filters,setFilters]=useState({})
    const brands=useSelector(selectBrands)
    const categories=useSelector(selectCategories)
    const [page,setPage]=useState(1)
    const products=useSelector(selectProducts)
    const dispatch=useDispatch()
    const theme=useTheme()
    const is500=useMediaQuery(theme.breakpoints.down(500))
    const isProductFilterOpen=useSelector(selectProductIsFilterOpen)
    const totalResults=useSelector(selectProductTotalResults)
    const productStatus=useSelector(selectProductStatus)
    
    const is1200=useMediaQuery(theme.breakpoints.down(1200))
    const is800=useMediaQuery(theme.breakpoints.down(800))
    const is700=useMediaQuery(theme.breakpoints.down(700))
    const is600=useMediaQuery(theme.breakpoints.down(600))
    const is488=useMediaQuery(theme.breakpoints.down(488))

    useEffect(()=>{
        setPage(1)
    },[totalResults])

    useEffect(()=>{
        const finalFilters={...filters}

        finalFilters['pagination']={page:page,limit:ITEMS_PER_PAGE}

        dispatch(fetchProductsAsync(finalFilters))
        
    },[filters,page])

    // Handle delete operation status
    useEffect(()=>{
        if(productStatus === 'fulfilled') {
            toast.success("Product operation completed successfully!");
            // Refresh the product list to reflect changes
            const finalFilters={...filters}
            finalFilters['pagination']={page:page,limit:ITEMS_PER_PAGE}
            dispatch(fetchProductsAsync(finalFilters))
        } else if(productStatus === 'rejected') {
            toast.error("Failed to perform product operation. Please try again.");
        }
    }, [productStatus])

    const handleBrandFilters=(e)=>{

        const filterSet=new Set(filters.brand)

        if(e.target.checked){filterSet.add(e.target.value)}
        else{filterSet.delete(e.target.value)}

        const filterArray = Array.from(filterSet);
        setFilters({...filters,brand:filterArray})
    }

    const handleCategoryFilters=(e)=>{
        const filterSet=new Set(filters.category)

        if(e.target.checked){filterSet.add(e.target.value)}
        else{filterSet.delete(e.target.value)}

        const filterArray = Array.from(filterSet);
        setFilters({...filters,category:filterArray})
    }

    const handleProductDelete=(productId, productTitle)=>{
        if(window.confirm(`Are you sure you want to delete "${productTitle}"? This action can be undone later.`)) {
            dispatch(deleteProductByIdAsync(productId))
            toast.info("Deleting product...");
        }
    }

    const handleProductUnDelete=(productId, productTitle)=>{
        if(window.confirm(`Are you sure you want to restore "${productTitle}"?`)) {
            dispatch(undeleteProductByIdAsync(productId))
            toast.info("Restoring product...");
        }
    }

    const handleFilterClose=()=>{
        dispatch(toggleFilters())
    }

  return (
    <>

    <motion.div style={{position:"fixed",backgroundColor:"white",height:"100vh",padding:'1rem',overflowY:"scroll",width:is500?"100vw":"30rem",zIndex:500}}  variants={{show:{left:0},hide:{left:-500}}} initial={'hide'} transition={{ease:"easeInOut",duration:.7,type:"spring"}} animate={isProductFilterOpen===true?"show":"hide"}>

        {/* fitlers section */}
        <Stack mb={'5rem'}  sx={{scrollBehavior:"smooth",overflowY:"scroll"}}>

        
            <Typography variant='h4'>New Arrivals</Typography>


                <IconButton onClick={handleFilterClose} style={{position:"absolute",top:15,right:15}}>
                    <motion.div whileHover={{scale:1.1}} whileTap={{scale:0.9}}>
                        <ClearIcon fontSize='medium'/>
                    </motion.div>
                </IconButton>


        <Stack rowGap={2} mt={4} >
            <Typography sx={{cursor:"pointer"}} variant='body2'>Web Scrapers</Typography>
            <Typography sx={{cursor:"pointer"}} variant='body2'>API Tools</Typography>
            <Typography sx={{cursor:"pointer"}} variant='body2'>Data Analytics</Typography>
            <Typography sx={{cursor:"pointer"}} variant='body2'>Testing Automation</Typography>
            <Typography sx={{cursor:"pointer"}} variant='body2'>Workflow Builders</Typography>
        </Stack>

        {/* brand filters */}
        <Stack mt={2}>
            <Accordion>
                <AccordionSummary expandIcon={<AddIcon />}  aria-controls="brand-filters" id="brand-filters" >
                        <Typography>Brands</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{p:0}}>
                    <FormGroup onChange={handleBrandFilters}>
                        {
                            Array.isArray(brands) && brands.map((brand)=>(
                                <motion.div key={brand._id} style={{width:"fit-content"}} whileHover={{x:5}} whileTap={{scale:0.9}}>
                                    <FormControlLabel sx={{ml:1}} control={<Checkbox whileHover={{scale:1.1}} />} label={brand.name} value={brand._id} />
                                </motion.div>
                            ))
                        }
                    </FormGroup>
                </AccordionDetails>
            </Accordion>
        </Stack>

        {/* category filters */}
        <Stack mt={2}>
            <Accordion>
                <AccordionSummary expandIcon={<AddIcon />}  aria-controls="brand-filters" id="brand-filters" >
                        <Typography>Category</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{p:0}}>
                    <FormGroup onChange={handleCategoryFilters}>
                        {
                            Array.isArray(categories) && categories.map((category)=>(
                                <motion.div key={category._id} style={{width:"fit-content"}} whileHover={{x:5}} whileTap={{scale:0.9}}>
                                    <FormControlLabel sx={{ml:1}} control={<Checkbox whileHover={{scale:1.1}} />} label={category.name} value={category._id} />
                                </motion.div>
                            ))
                        }
                    </FormGroup>
                </AccordionDetails>
            </Accordion>
        </Stack>
</Stack>

    </motion.div>

    <Stack rowGap={5} mt={is600?2:5} mb={'3rem'}>
     
        <Grid gap={2} container flex={1} justifyContent={'center'} alignContent={"center"}>
            {
                products.map((product)=>(
                    <Stack>
                        <Stack sx={{opacity:product.isDeleted?.7:1}}>
                            <ProductCard key={product._id} id={product._id} title={product.title} thumbnail={product.thumbnail} brand={product.brand.name} price={product.price} isAdminCard={true}/>
                        </Stack>
                        <Stack paddingLeft={2} paddingRight={2} flexDirection={'row'} justifySelf={'flex-end'} alignSelf={'flex-end'} columnGap={is488?1:2}>
                            <Button component={Link} to={`/admin/product-update/${product._id}`} variant='contained'>Update</Button>
                            {
                                product.isDeleted===true?(
                                    <Button onClick={()=>handleProductUnDelete(product._id, product.title)} color='success' variant='outlined'>Restore</Button>
                                ):(
                                    <Button onClick={()=>handleProductDelete(product._id, product.title)} color='error' variant='outlined'>Delete</Button>
                                )
                            }
                        </Stack>
                    </Stack>
                ))
            }
        </Grid>

        <Stack alignSelf={is488?'center':'flex-end'} mr={is488?0:5} rowGap={2} p={is488?1:0}>
            <Pagination size={is488?'medium':'large'} page={page}  onChange={(e,page)=>setPage(page)} count={Math.ceil(totalResults/ITEMS_PER_PAGE)} variant="outlined" shape="rounded" />
            <Typography textAlign={'center'}>Showing {(page-1)*ITEMS_PER_PAGE+1} to {page*ITEMS_PER_PAGE>totalResults?totalResults:page*ITEMS_PER_PAGE} of {totalResults} results</Typography>
        </Stack>    
    
    </Stack> 
    </>
  )
}
