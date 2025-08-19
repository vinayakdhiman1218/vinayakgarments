import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Step 1: Enter Email Schema
const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Step 2: Verify OTP Schema
const verifyOtpSchema = z.object({
  token: z.string().min(6, "Verification code must be 6 characters"),
});

// Step 3: Complete Registration Schema
const completeRegistrationSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof verifyOtpSchema>;
type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;

enum RegistrationStep {
  EMAIL = 1,
  VERIFY_OTP = 2,
  COMPLETE_REGISTRATION = 3,
}

interface RegisterFlowProps {
  onRegistrationComplete: () => void;
}

export function RegisterFlow({ onRegistrationComplete }: RegisterFlowProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(RegistrationStep.EMAIL);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Step 1: Email Form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Step 2: OTP Form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { token: "" },
  });

  // Step 3: Complete Registration Form
  const completeRegistrationForm = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Handle Step 1: Send verification code to email
  const handleSendVerificationCode = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEmail(data.email);
        setCurrentStep(RegistrationStep.VERIFY_OTP);
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (data: OtpFormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token: data.token }),
      });

      if (response.ok) {
        setCurrentStep(RegistrationStep.COMPLETE_REGISTRATION);
        toast({
          title: "Email Verified",
          description: "Your email has been verified. Please complete your registration.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Complete Registration
  const handleCompleteRegistration = async (data: CompleteRegistrationFormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Registration Complete",
          description: "Your account has been created successfully.",
        });
        onRegistrationComplete();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Verification Code Resent",
          description: "Please check your email for the new verification code.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to resend verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle step navigation
  const goBack = () => {
    if (currentStep === RegistrationStep.VERIFY_OTP) {
      setCurrentStep(RegistrationStep.EMAIL);
    } else if (currentStep === RegistrationStep.COMPLETE_REGISTRATION) {
      setCurrentStep(RegistrationStep.VERIFY_OTP);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          {currentStep === RegistrationStep.EMAIL && "Enter your email to start the registration process."}
          {currentStep === RegistrationStep.VERIFY_OTP && "Enter the verification code sent to your email."}
          {currentStep === RegistrationStep.COMPLETE_REGISTRATION && "Set up your account details to complete registration."}
        </CardDescription>
      </CardHeader>

      {/* Step 1: Email Form */}
      {currentStep === RegistrationStep.EMAIL && (
        <form onSubmit={emailForm.handleSubmit(handleSendVerificationCode)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onRegistrationComplete}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
          </CardFooter>
        </form>
      )}

      {/* Step 2: Verification Code Form */}
      {currentStep === RegistrationStep.VERIFY_OTP && (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter 6-character code"
                {...otpForm.register("token")}
              />
              {otpForm.formState.errors.token && (
                <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.token.message}</p>
              )}
            </div>
            <div className="text-sm">
              <p>
                A verification code has been sent to <span className="font-medium">{email}</span>
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-blue-600 hover:underline mt-2 text-sm"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={goBack} disabled={loading}>
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </CardFooter>
        </form>
      )}

      {/* Step 3: Complete Registration Form */}
      {currentStep === RegistrationStep.COMPLETE_REGISTRATION && (
        <form onSubmit={completeRegistrationForm.handleSubmit(handleCompleteRegistration)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...completeRegistrationForm.register("password")}
              />
              {completeRegistrationForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {completeRegistrationForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...completeRegistrationForm.register("confirmPassword")}
              />
              {completeRegistrationForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {completeRegistrationForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={goBack} disabled={loading}>
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Completing..." : "Complete Registration"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}