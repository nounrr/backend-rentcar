import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M16 29C21.5 24.1 25 19.8 25 14.6C25 9.6 21 5.5 16 5.5C11 5.5 7 9.6 7 14.6C7 19.8 10.5 24.1 16 29Z"
        fill="currentColor"
      />
      <path
        d="M11.5 27.25C8.2 26.85 5.75 25.8 5.75 24.55C5.75 23.6 7.2 22.75 9.45 22.25"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22.55 22.25C24.8 22.75 26.25 23.6 26.25 24.55C26.25 25.8 23.8 26.85 20.5 27.25"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="14.5" r="4.25" fill="var(--brand)" />
      <path
        d="M14 14.65L15.35 16L18.25 12.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
