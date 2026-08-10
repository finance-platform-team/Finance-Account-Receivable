import styles from './AppShell.module.css';
import { useCurrentUser } from './useCurrentUser';

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const user = useCurrentUser();

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTitle}>{title}</div>

      {user && (
        <div className={styles.userChip}>
          <div className={styles.userText}>
            <div className={styles.userName}>{user.fullName}</div>
            <div className={styles.userSub}>Signed in</div>
          </div>
          <div className={styles.userAvatar}>{initialsOf(user.fullName)}</div>
        </div>
      )}
    </header>
  );
}
