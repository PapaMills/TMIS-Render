import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white mb-2">{title}</CardTitle>
        <CardDescription className="text-green-200">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}
