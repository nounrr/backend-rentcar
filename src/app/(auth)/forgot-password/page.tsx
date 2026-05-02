import { ForgotPasswordForm1 } from "./components/forgot-password-form-1"
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="brand-shell relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10">
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="brand-badge text-foreground flex size-10 items-center justify-center rounded-xl">
            <Logo size={24} />
          </div>
          Tanger Stylo
        </Link>
        <ForgotPasswordForm1 />
      </div>
    </div>
  )
}
