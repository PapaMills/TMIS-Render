import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1599045118108-bf9954418b76?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      />
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full space-y-8 text-center bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-8 mx-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to NHS TMIS</h1>
          <p className="text-green-200 text-lg">Secure Authentication System</p>
          <p className="text-white text-sm mt-4 leading-relaxed">
            This secure medical dashboard provides healthcare professionals with protected access to patient
            information, appointment scheduling, and clinical workflows while maintaining the highest standards of data
            security and privacy compliance.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2">
              Login
            </Button>
          </Link>

          <Link href="/register" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-green-400/30 text-green-200 hover:bg-green-500/10 py-3 text-lg bg-transparent backdrop-blur-sm transition-all duration-200"
            >
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
