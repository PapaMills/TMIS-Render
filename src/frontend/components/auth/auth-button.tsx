"use client"

import type React from "react"

import { Button } from "@/components/ui/button"

interface AuthButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary" | "ghost"
  className?: string
  disabled?: boolean
}

export function AuthButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}: AuthButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
      case "secondary":
        return "w-full border-green-600 text-green-600 hover:bg-green-50 py-2"
      case "ghost":
        return "w-full text-white/60 hover:text-white hover:bg-white/10"
      default:
        return "w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2"
    }
  }

  return (
    <Button type={type} onClick={onClick} className={`${getVariantClasses()} ${className}`} disabled={disabled}>
      {children}
    </Button>
  )
}
