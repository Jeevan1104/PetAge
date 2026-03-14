import { InputHTMLAttributes, forwardRef } from "react";

// Design Brief §05: 48px height, 10px radius
// Border default: 1.5px #C5D0E0
// Focus: 1.5px #1C5EA8
// Error: 1.5px #BE123C

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-12 px-3.5
            rounded-[10px] border-[1.5px]
            font-sans text-[14px] text-text-primary
            bg-card placeholder:text-text-tertiary
            outline-none transition-colors duration-150
            ${error
              ? "border-status-red focus:border-status-red"
              : "border-border-strong focus:border-clinical-blue"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-caption text-status-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-text-tertiary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
