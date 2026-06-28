import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | smartLocation",
  description: "Access the smartLocation back-office.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
