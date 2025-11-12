import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider
} from "@mui/material";
import {
    createPaymentOrderAsync,
    verifyPaymentAsync,
    handlePaymentFailureAsync,
    selectPaymentStatus,
    selectPaymentOrder,
    selectPaymentErrors,
    clearPaymentErrors,
    clearPaymentOrder
} from "../PaymentSlice";
import { selectCartItems } from "../../cart/CartSlice";
import { selectLoggedInUser } from "../../auth/AuthSlice";
import { selectAddresses } from "../../address/AddressSlice";

const PaymentComponent = ({ orderData, onPaymentSuccess, onPaymentCancel, selectedAddress }) => {
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    const paymentStatus = useSelector(selectPaymentStatus);
    const paymentOrder = useSelector(selectPaymentOrder);
    const paymentErrors = useSelector(selectPaymentErrors);
    const cartItems = useSelector(selectCartItems);
    const currentUser = useSelector(selectLoggedInUser);
    const addresses = useSelector(selectAddresses);
    
    // Calculate total price from cart items
    const totalPrice = cartItems?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;

    useEffect(() => {
        return () => {
            dispatch(clearPaymentErrors());
            dispatch(clearPaymentOrder());
        };
    }, [dispatch]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePaymentInitiation = async () => {
        try {
            setIsProcessing(true);
            
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert("Failed to load Razorpay. Please check your internet connection.");
                setIsProcessing(false);
                return;
            }

            // Prepare order data
            const paymentOrderData = {
                amount: orderData?.amount || Math.round(totalPrice * 100), // Convert to paise and ensure integer
                currency: "INR",
                receipt: `order_${Date.now()}`,
                notes: {
                    orderType: "ecommerce",
                    customerEmail: currentUser?.email || "",
                    items: cartItems?.map(item => `${item.title} (${item.quantity})`).join(", ") || ""
                }
            };

            // Create payment order
            const result = await dispatch(createPaymentOrderAsync(paymentOrderData));
            
            if (result.type === "payment/createPaymentOrderAsync/fulfilled") {
                setShowPaymentDialog(true);
            }
        } catch (error) {
            // Log sanitized error without exposing sensitive payment data
            console.error("Payment initiation failed");
            setIsProcessing(false);
        }
    };

    const initiateRazorpayPayment = () => {
        if (!paymentOrder) return;

        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            name: "ToolCart",
            description: "Payment for automation tools",
            order_id: paymentOrder.id,
            image: window.location.protocol + "//" + window.location.host + "/logo192.png", // Your app logo with proper protocol
            handler: async function (response) {
                await handlePaymentSuccess(response);
            },
            prefill: {
                name: currentUser?.name || "",
                email: currentUser?.email || "",
                contact: selectedAddress?.phoneNumber || ""
            },
            notes: paymentOrder.notes,
            theme: {
                color: "#1976d2"
            },
            modal: {
                ondismiss: function() {
                    handlePaymentCancel();
                }
            },
            retry: {
                enabled: true,
                max_count: 3
            }
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
            handlePaymentFailure(response.error);
        });

        rzp.open();
        setIsProcessing(false);
        setShowPaymentDialog(false);
    };

    const handlePaymentSuccess = async (response) => {
        try {
            setIsProcessing(true);
            
            // Create the order first, then verify payment
            const paymentData = {
                paymentId: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
            };

            // Call the parent's onPaymentSuccess with the payment data
            onPaymentSuccess && onPaymentSuccess(paymentData);
            
        } catch (error) {
            // Log sanitized error without exposing payment verification details
            console.error("Payment success handling failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentFailure = async (error) => {
        try {
            const failureData = {
                error: error,
                orderId: paymentOrder?.id,
                amount: paymentOrder?.amount,
                timestamp: new Date().toISOString()
            };

            await dispatch(handlePaymentFailureAsync(failureData));
            
            alert(`Payment failed: ${error.description || "Unknown error"}`);
        } catch (err) {
            // Log sanitized error without exposing payment failure details
            console.error("Payment failure handling error occurred");
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentDialog(false);
        setIsProcessing(false);
        onPaymentCancel && onPaymentCancel();
    };

    return (
        <Box>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Payment Details
                    </Typography>
                    
                    <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                            Total Amount: ₹{orderData?.amount ? (orderData.amount / 100) : totalPrice}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Payment Method: Razorpay (Cards, UPI, Net Banking, Wallets)
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {paymentErrors && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {paymentErrors}
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={handlePaymentInitiation}
                        disabled={isProcessing || paymentStatus === "pending"}
                        startIcon={isProcessing && <CircularProgress size={20} />}
                    >
                        {isProcessing ? "Processing..." : "Pay Now"}
                    </Button>

                    <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: "center" }}>
                        Secure payment powered by Razorpay
                    </Typography>
                </CardContent>
            </Card>

            {/* Payment Confirmation Dialog */}
            <Dialog
                open={showPaymentDialog}
                onClose={handlePaymentCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        You are about to pay ₹{paymentOrder?.amount / 100} for your order.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click "Proceed to Payment" to continue with Razorpay checkout.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePaymentCancel} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        onClick={initiateRazorpayPayment}
                        variant="contained"
                        color="primary"
                    >
                        Proceed to Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentComponent;