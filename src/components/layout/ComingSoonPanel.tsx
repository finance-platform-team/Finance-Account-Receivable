import styles from './AppShell.module.css';

interface ComingSoonPanelProps {
  icon: string;
  title: string;
}

export function ComingSoonPanel({ icon, title }: ComingSoonPanelProps) {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.comingSoonIcon}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className={styles.comingSoonTitle}>{title}</div>
      <div className={styles.comingSoonMsg}>This page isn&apos;t built yet.</div>
    </div>
  );
}
