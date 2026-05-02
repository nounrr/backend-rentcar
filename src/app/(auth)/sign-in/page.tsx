import { LoginForm1 } from "./components/login-form-1"

export default function Page() {
  return (
    <div className="brand-shell relative flex min-h-svh items-center justify-center overflow-hidden p-6 md:p-10">
      <div className="relative z-10 w-full max-w-md">
        <LoginForm1 />
      </div>
    </div>
  )
}
