import { axiosInstance } from "../../config/axios";

export const addProduct=async(data)=>{
    try {
        const res=await axiosInstance.post('/products',data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}
export const fetchProducts=async(filters)=>{

    let queryString=''

    if(filters.brand){
        filters.brand.forEach((brand)=>{
            queryString+=`brand=${brand}&`
        })
    }
    if(filters.category){
        filters.category.forEach((category)=>{
            queryString+=`category=${category}&`
        })
    }

    if(filters.pagination){
        queryString+=`page=${filters.pagination.page}&limit=${filters.pagination.limit}&`
    }

    // Removed sort filter from query string

    if(filters.search){
        queryString+=`search=${encodeURIComponent(filters.search)}&`
    }

    if(filters.user){
        queryString+=`user=${filters.user}&`
    }
    
    try {
        const res=await axiosInstance.get(`/products?${queryString}`)
        const totalResults=await res.headers.get("X-Total-Count")
        return {data:res.data,totalResults:totalResults}
    } catch (error) {
        throw error.response.data
    }
}
export const fetchProductById=async(id)=>{
    try {
        const res=await axiosInstance.get(`/products/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}
export const updateProductById=async(update)=>{
    try {
        console.log('Sending product update request for ID:', update._id);
        console.log('Update data:', update);
        const res=await axiosInstance.patch(`/products/${update._id}`,update)
        console.log('Product update response:', res.data);
        return res.data
    } catch (error) {
        console.error('Product update API error:', error);
        console.error('Error response:', error.response?.data);
        throw error.response?.data || { message: 'Network error or server unavailable' };
    }
}
export const undeleteProductById=async(id)=>{
    try {
        const res=await axiosInstance.patch(`/products/undelete/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}
export const deleteProductById=async(id)=>{
    try {
        const res=await axiosInstance.delete(`/products/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}
