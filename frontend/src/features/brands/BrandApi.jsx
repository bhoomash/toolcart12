import { axiosInstance } from "../../config/axios";

export const fetchBrands=async()=>{
    try {
        const res=await axiosInstance.get("/brands")
        return res.data.data
    } catch (error) {
        throw error.response.data
    }
}