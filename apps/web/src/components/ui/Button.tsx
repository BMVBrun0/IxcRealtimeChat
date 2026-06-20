"use client";

import type { ButtonHTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  arrow?: boolean;
}

export const Button = ({
  className,
  children,
  variant = "primary",
  size = "lg",
  arrow = false,
  ...props
}: ButtonProps) => {
  return (
    <button className={clsx(styles.button, styles[variant], styles[size], className)} {...props}>
      <span>{children}</span>
      {arrow ? <ArrowRight size={20} strokeWidth={2.2} /> : null}
    </button>
  );
};
