import { getInitials } from "@/lib/format";
import { UserSummary } from "@/types";
import styles from "./Avatar.module.css";

interface AvatarProps {
  user: Pick<UserSummary, "name" | "avatarColor" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
}

export const Avatar = ({ user, size = "md" }: AvatarProps) => {
  const className = `${styles.avatar} ${styles[`avatar${size[0].toUpperCase()}${size.slice(1)}`]}`;

  if (user.avatarUrl) {
    return <img alt={user.name} className={className} src={user.avatarUrl} />;
  }

  return (
    <div className={className} style={{ background: user.avatarColor }}>
      {getInitials(user.name)}
    </div>
  );
};
