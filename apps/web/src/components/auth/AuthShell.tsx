import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./AuthShell.module.css";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
}

export const AuthShell = ({
  title,
  subtitle,
  footerText,
  footerHref,
  footerLabel,
  children
}: AuthShellProps) => {
  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <section className={styles.card}>
          <div className={styles.cardTop} />
          <header className={styles.header}>

            <div className={styles.heading}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          </header>

          <div className={styles.formSlot}>{children}</div>

          <footer className={styles.footer}>
            <span>{footerText}</span>
            <Link className={styles.footerLink} href={footerHref}>
              {footerLabel}
            </Link>
          </footer>
        </section>
      </section>
    </main>
  );
};
