import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "gold";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

interface ButtonAsButton extends ButtonBaseProps {
  as?: "button";
  href?: never;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

interface ButtonAsLink extends ButtonBaseProps {
  as: "link";
  href: string;
  external?: boolean;
  type?: never;
  onClick?: never;
  disabled?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

// ZORA Noir Warm button variants
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-brand-white text-brand-black font-semibold border border-brand-white",
    "hover:bg-brand-gold hover:text-brand-white hover:border-brand-gold",
    "hover:shadow-[0_0_24px_rgba(86,50,122,0.35)]",
    "active:scale-[0.98]"
  ),
  outline: cn(
    "bg-transparent text-brand-white border border-brand-gold",
    "hover:bg-[rgba(86,50,122,0.18)] hover:shadow-[0_0_18px_rgba(86,50,122,0.28)]",
    "active:scale-[0.98]"
  ),
  ghost: cn(
    "text-brand-muted border-transparent",
    "hover:text-brand-champagne hover:bg-brand-surface",
    "active:scale-[0.98]"
  ),
  gold: cn(
    "bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light",
    "text-brand-white font-bold",
    "hover:shadow-gold-lg hover:scale-[1.02]",
    "active:scale-[0.98]"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "px-4 py-2 text-xs tracking-wider",
  md:  "px-6 py-3 text-sm tracking-wide",
  lg:  "px-8 py-4 text-base tracking-wide",
};

const baseStyles = cn(
  "inline-flex items-center justify-center gap-2 rounded-full",
  "transition-all duration-300",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black",
  "disabled:opacity-40 disabled:pointer-events-none"
);

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  if (props.as === "link") {
    const { href, external } = props as ButtonAsLink;
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props as ButtonAsButton;
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
