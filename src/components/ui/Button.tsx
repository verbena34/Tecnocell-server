import React from "react";

export default function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost";
  [k: string]: any;
}) {
  const base = "px-4 py-2 rounded-xl font-medium";
  const styles = variant === "primary" ? "bg-primary-500 text-white" : "bg-transparent border";
  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
