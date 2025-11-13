import { axiosInstance } from "../../config/axios"

export const fetchCategories=async()=>{
    try {
        const res=await axiosInstance.get("/categories")
        return res.data.data
    } catch (error) {
        throw error.response.data
    }
}