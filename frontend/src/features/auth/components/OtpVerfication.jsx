import {FormHelperText, Paper, Stack, TextField, Typography } from '@mui/material'
import React, { useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearOtpVerificationError, clearResendOtpError, clearResendOtpSuccessMessage, resendOtpAsync, resetOtpVerificationStatus, resetResendOtpStatus, selectLoggedInUser, selectOtpVerificationError, selectOtpVerificationStatus, selectResendOtpError, selectResendOtpStatus, selectResendOtpSuccessMessage, verifyOtpAsync } from '../AuthSlice'
import { LoadingButton } from '@mui/lab'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from "react-hook-form"
import {toast} from 'react-toastify'


export const OtpVerfication = () => {
    
    const {register,handleSubmit,formState: { errors }} = useForm()
    const dispatch=useDispatch()
    const loggedInUser=useSelector(selectLoggedInUser)
    const navigate=useNavigate()
    const location=useLocation()
    
    // Get user data from navigation state (from signup) or from logged-in user
    const userData = location.state?.userData || loggedInUser
    const resendOtpStatus=useSelector(selectResendOtpStatus)
    const resendOtpError=useSelector(selectResendOtpError)
    const resendOtpSuccessMessage=useSelector(selectResendOtpSuccessMessage)
    const otpVerificationStatus=useSelector(selectOtpVerificationStatus)
    const otpVerificationError=useSelector(selectOtpVerificationError)

    // handles the redirection based on user role
    useEffect(()=>{
        if(!userData){
            navigate('/login')
        }
        else if(loggedInUser && loggedInUser?.isVerified){
            // Redirect based on user role after verification
            if(loggedInUser.isAdmin){
                navigate("/admin/dashboard")
            } else {
                navigate("/")
            }
        }
    },[userData, loggedInUser, navigate])

    const handleSendOtp=()=>{
        const data={user:userData?._id}
        dispatch(resendOtpAsync(data))
    }
    
    const handleVerifyOtp=(data)=>{
        const cred={...data,userId:userData?._id}
        dispatch(verifyOtpAsync(cred))
    }

    // handles resend otp error
    useEffect(()=>{
        if(resendOtpError){
            toast.error(resendOtpError.message)
        }
        return ()=>{
            dispatch(clearResendOtpError())
        }
    },[resendOtpError, dispatch])

    // handles resend otp success message
    useEffect(()=>{
        if(resendOtpSuccessMessage){
            toast.success(resendOtpSuccessMessage.message)
        }
        return ()=>{
            dispatch(clearResendOtpSuccessMessage())
        }
    },[resendOtpSuccessMessage, dispatch])

    // handles error while verifying otp
    useEffect(()=>{
        if(otpVerificationError){
            toast.error(otpVerificationError.message)
        }
        return ()=>{
            dispatch(clearOtpVerificationError())
        }
    },[otpVerificationError, dispatch])

    useEffect(()=>{
        if(otpVerificationStatus==='fulfilled'){
            toast.success("Email verified! Welcome to ToolCart!")
            dispatch(resetResendOtpStatus())
            // Navigate based on user role after successful verification
            if(loggedInUser?.isAdmin){
                navigate("/admin/dashboard")
            } else {
                navigate("/")
            }
        }
        return ()=>{
            dispatch(resetOtpVerificationStatus())
        }
    },[otpVerificationStatus, dispatch, navigate, loggedInUser])

  return (
    <Stack width={'100vw'} height={'100vh'} noValidate flexDirection={'column'} rowGap={3} justifyContent="center" alignItems="center" >

        
        <Stack component={Paper} elevation={1} position={'relative'} justifyContent={'center'} alignItems={'center'} p={'2rem'} rowGap={'2rem'}>
            
            <Typography mt={4} variant='h5' fontWeight={500}>Verify Your Email Address</Typography>

            {
                userData && !userData?.isVerified ?(
                    <Stack width={'100%'} rowGap={'1rem'} component={'form'} noValidate onSubmit={handleSubmit(handleVerifyOtp)}>
                        <Stack rowGap={'1rem'}> 
                            <Stack>
                                <Typography  color={'GrayText'}>Enter the 4 digit OTP sent on</Typography>
                                <Typography fontWeight={'600'} color={'GrayText'}>{userData?.email}</Typography>
                            </Stack>
                            <Stack>
                                <TextField {...register("otp",{required:"OTP is required",minLength:{value:4,message:"Please enter a 4 digit OTP"}})} fullWidth type='number' />
                                {errors?.otp && <FormHelperText sx={{color:"red"}}>{errors.otp.message}</FormHelperText>}
                            </Stack>
                       </Stack>
                        <Stack flexDirection={'row'} gap={2}>
                            <LoadingButton loading={otpVerificationStatus==='pending'}  type='submit' fullWidth variant='contained'>Verify</LoadingButton>
                            <LoadingButton onClick={handleSendOtp} loading={resendOtpStatus==='pending'} variant='outlined' fullWidth>Resend OTP</LoadingButton>
                        </Stack>
                    </Stack>
                ):
                <Stack>
                    <Typography variant="h6" color={'success.main'} textAlign="center">
                        Your email is already verified!
                    </Typography>
                    <Typography color={'GrayText'} textAlign="center">
                        You can now access all features.
                    </Typography>
                </Stack>
             }

        </Stack>
    </Stack>
  )
}
