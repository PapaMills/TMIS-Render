import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthAlertProps {
  type: "error" | "success" | "warning"
  message: string
}

export function AuthAlert({ type, message }: AuthAlertProps) {
  const getAlertClasses = () => {
    switch (type) {
      case "error":
        return "bg-red-500/20 border-red-500/50 text-red-100"
      case "success":
        return "bg-green-500/20 border-green-500/50 text-green-100"
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-100"
      default:
        return "bg-red-500/20 border-red-500/50 text-red-100"
    }
  }

  return (
    <Alert className={getAlertClasses()}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
