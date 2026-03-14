import { ButtonHTMLAttributes, forwardRef } from "react";

// Design Brief §05: 48px height, 10px radius
// Primary: #1C5EA8 bg, white text
// Secondary: 1.5px blue border
// Ghost: 1px border-strong
// Disabled: opacity 0.4

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-clinical-blue text-white hover:brightness-110 active:scale-[0.97]",
  secondary:
    "bg-transparent text-clinical-blue border-[1.5px] border-clinical-blue hover:bg-blue-tint active:scale-[0.97]",
  ghost:
    "bg-transparent text-text-secondary border border-border-strong hover:bg-surface active:scale-[0.97]",
  danger:
    "bg-status-red text-white hover:brightness-110 active:scale-[0.97]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  default: "h-12 px-6 text-[14px]",
  lg: "h-14 px-8 text-[15px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-[10px] font-medium font-sans
          transition-all duration-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-blue focus-visible:ring-offset-2
          disabled:opacity-40 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
