"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Key, Shield, CheckCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { generateECCKeyPair, storeKeys } from "@/lib/ecc"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState<"registration" | "key-generation" | "confirmation">("registration")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nhisNumber: "",
    department: "",
    role: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Please fill in all required fields")
      return
    }

    // NHIS number validation (simple alphanumeric + min length)
    if (!formData.nhisNumber || !/^[A-Za-z0-9-]{6,}$/.test(formData.nhisNumber)) {
      setError("Please enter a valid NHIS Number (at least 6 alphanumeric characters)")
      return
    }

    if (!formData.department) {
      setError("Please select your department")
      return
    }

    if (!formData.role) {
      setError("Please select your role")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    // Move to key generation step
    setStep("key-generation")
  }

  const generateKeyPair = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Generate real ECC key pair
      const keys = await generateECCKeyPair()
      setKeyPair(keys)

      // Register user with the backend
      const response = await apiClient.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        publicKey: keys.publicKey,
      })

      if (response.success) {
        // Store keys locally
        storeKeys(keys)
        setStep("confirmation")
        setSuccess("Account created successfully. Public key registered with server.")
      } else {
        setError(response.message || "Registration failed")
        setStep("registration")
      }
    } catch (err) {
      setError("Failed to generate keys or register account")
      console.error('Registration error:', err)
      setStep("registration")
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
      <div className="relative z-10 w-full max-w-xl"> {/* updated max width */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white mb-2">NHS TMIS Registration</CardTitle>
            <CardDescription className="text-green-200">
              Create your secure account with ECC authentication
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

            {step === "registration" && (
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@nhs.uk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                    required
                  />
                </div>

                {/* NEW: NHIS Number */}
                <div className="space-y-2">
                  <Label htmlFor="nhisNumber" className="text-white">
                    NHIS Number
                  </Label>
                  <Input
                    id="nhisNumber"
                    type="text"
                    placeholder="NHIS123456"
                    value={formData.nhisNumber}
                    onChange={(e) => setFormData({ ...formData, nhisNumber: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400"
                    required
                  />
                </div>

                {/* NEW: Department and Role dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white">
                      Department
                    </Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:border-green-400 p-2 rounded appearance-none"
                      required
                    >
                      <option value="" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Select department</option>
                      <option value="Cardiology" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Cardiology</option>
                      <option value="Emergency" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Emergency</option>
                      <option value="Pediatrics" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Pediatrics</option>
                      <option value="General" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>General</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">
                      Role
                    </Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:border-green-400 p-2 rounded appearance-none"
                      required
                    >
                      <option value="" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Select role</option>
                      <option value="Doctor" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Doctor</option>
                      <option value="Nurse" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Nurse</option>
                      <option value="Admin" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Admin</option>
                      <option value="Support" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>Support</option>
                    </select>
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-green-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                    className="border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label htmlFor="terms" className="text-white/80 text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-green-300 hover:text-green-200 underline">
                      Terms and Conditions
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                >
                  Continue to Key Generation
                </Button>
              </form>
            )}

            {step === "key-generation" && (
              <div className="space-y-4">
                <div className="text-center">
                  <Key className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">ECC Key Pair Generation</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Generate your cryptographic key pair for secure authentication
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-2 text-white/80">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Your private key will be stored securely on your device</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Your public key will be registered with the server</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Keys are generated using secure ECC algorithms</span>
                  </div>
                </div>

                <Button
                  onClick={generateKeyPair}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Keys...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Key Pair
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep("registration")}
                  className="w-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  Back to Registration
                </Button>
              </div>
            )}

            {step === "confirmation" && keyPair && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Registration Complete!</h3>
                  <p className="text-white/80 text-sm mb-4">Your account has been created successfully</p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg space-y-3">
                  {/* NEW: show NHIS, Department and Role */}
                  <div>
                    <Label className="text-white/80 text-xs">NHIS Number:</Label>
                    <p className="text-white/80 font-mono text-xs break-all mt-1">{formData.nhisNumber}</p>
                  </div>
                  <div>
                    <Label className="text-white/80 text-xs">Department:</Label>
                    <p className="text-green-300 text-xs break-all mt-1">{formData.department}</p>
                  </div>
                  <div>
                    <Label className="text-white/80 text-xs">Role:</Label>
                    <p className="text-green-300 text-xs break-all mt-1">{formData.role}</p>
                  </div>

                  <div>
                    <Label className="text-white/80 text-xs">Public Key (Registered):</Label>
                    <p className="text-green-300 font-mono text-xs break-all mt-1">{keyPair.publicKey}</p>
                  </div>
                  <div>
                    <Label className="text-white/80 text-xs">Private Key (Keep Secure):</Label>
                    <p className="text-yellow-300 font-mono text-xs break-all mt-1">{keyPair.privateKey}</p>
                  </div>
                </div>

                <Alert className="bg-yellow-500/20 border-yellow-500/50 text-yellow-100">
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Save your private key securely. You'll need it for authentication.
                  </AlertDescription>
                </Alert>

                <Link href="/login" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            )}

            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-white/60 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-green-300 hover:text-green-200 underline">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
