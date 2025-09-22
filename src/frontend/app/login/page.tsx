"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Shield, Key } from "lucide-react"
import { apiClient } from "@/lib/api"
import { signWithPrivateKey, getStoredKeys } from "@/lib/ecc"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<"credentials" | "ecc-challenge" | "mfa">("credentials")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    totpCode: "",
    securityAnswer: "",
  })
  const [challenge, setChallenge] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Try password login first
      const response = await apiClient.loginWithPassword(formData.email, formData.password)

      if (response.success) {
        setSuccess("Login successful! Redirecting to dashboard...")
        // Wait for cookie to be set before redirecting
        setTimeout(async () => {
          // Verify authentication before redirecting
          const isAuthValid = await apiClient.verifyAuthentication()
          if (isAuthValid) {
            router.push('/dashboard')
          } else {
            setError("Authentication verification failed. Please try logging in again.")
          }
        }, 1500)
      } else {
        // If password login fails, try ECC challenge
        const challengeResponse = await apiClient.loginChallenge(formData.email)

        if (challengeResponse.success && challengeResponse.data) {
          setChallenge(challengeResponse.data.nonce)
          setStep("ecc-challenge")
        } else {
          setError(response.message || "Login failed")
        }
      }
    } catch (err) {
      setError("An error occurred during login")
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleECCChallenge = async () => {
    setError("")
    setIsLoading(true)

    try {
      const storedKeys = getStoredKeys()
      if (!storedKeys) {
        setError("No ECC keys found. Please register first.")
        setStep("credentials")
        return
      }

      const signature = await signWithPrivateKey(storedKeys.privateKey, challenge)
      const response = await apiClient.loginVerify(formData.email, signature)

      if (response.success) {
        setSuccess("Login successful! Redirecting to dashboard...")
        // Wait for cookie to be set before redirecting
        setTimeout(async () => {
          // Verify authentication before redirecting
          const isAuthValid = await apiClient.verifyAuthentication()
          if (isAuthValid) {
            router.push('/dashboard')
          } else {
            setError("Authentication verification failed. Please try logging in again.")
          }
        }, 1500)
      } else {
        setError(response.message || "Signature verification failed")
      }
    } catch (err) {
      setError("An error occurred during signature verification")
      console.error('ECC login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // For now, just simulate MFA completion
      // In a real implementation, you would verify TOTP or security questions
      setSuccess("MFA verified. Login successful!")
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      setError("MFA verification failed")
      console.error('MFA error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1599045118108-bf9954418b76?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white mb-2">NHS TMIS Login</CardTitle>
            <CardDescription className="text-green-200">
              Secure authentication with ECC challenge-response
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-500/20 border-red-500/50 text-red-100">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/20 border-green-500/50 text-green-100">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Continue to ECC Challenge"
                  )}
                </Button>
              </form>
            )}

            {step === "ecc-challenge" && (
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">ECC Challenge</h3>
                  <p className="text-white/80 text-sm mb-4">Sign the challenge with your private key</p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg">
                  <Label className="text-white/80 text-xs">Challenge String:</Label>
                  <p className="text-green-300 font-mono text-sm break-all mt-1">{challenge}</p>
                </div>

                <Button
                  onClick={handleECCChallenge}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Sign Challenge
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep("credentials")}
                  className="w-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  Back to Credentials
                </Button>
              </div>
            )}

            {step === "mfa" && (
              <form onSubmit={handleMFASubmit} className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Additional Verification Required</h3>
                  <p className="text-white/80 text-sm mb-4">
                    High-risk login detected. Please complete additional verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totp" className="text-white">
                    TOTP Code (if available)
                  </Label>
                  <Input
                    id="totp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.totpCode}
                    onChange={(e) => setFormData({ ...formData, totpCode: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security" className="text-white">
                    Security Question
                  </Label>
                  <p className="text-white/80 text-sm">What was the name of your first pet?</p>
                  <Input
                    id="security"
                    type="text"
                    placeholder="Enter your answer"
                    value={formData.securityAnswer}
                    onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                >
                  Verify & Login
                </Button>
              </form>
            )}

            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-white/60 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-green-300 hover:text-green-200 underline">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
