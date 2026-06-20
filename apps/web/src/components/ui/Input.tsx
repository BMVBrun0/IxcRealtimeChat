"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
}

export const Input = ({ label, error, hint, endAdornment, id, ...props }: InputProps) => {
  const fieldId = id ?? props.name;

  return (
    <label className={styles.wrapper} htmlFor={fieldId}>
      <span className={styles.label}>{label}</span>
      <span className={styles.fieldWrap}>
        <input className={`${styles.field} ${endAdornment ? styles.fieldWithAdornment : ""}`} id={fieldId} {...props} />
        {endAdornment ? <span className={styles.adornment}>{endAdornment}</span> : null}
      </span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
};
