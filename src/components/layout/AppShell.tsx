import { useEffect, useMemo, useState } from 'react';
import styles from './AppShell.module.css';
import { ComingSoonPanel } from './ComingSoonPanel';
import { Topbar } from './Topbar';
import { ArAgingPage } from '../../features/ar-aging/ArAgingPage';
import { CollectionPlanPage } from '../../features/collection-plan/CollectionPlanPage';

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

// "AR Aging" and "Collection Plan" are wired to real data; the rest mirror the
// Collection Networking reference sidebar as placeholders until built.
const NAV_ITEMS: NavItem[] = [
  { key: 'ar-aging', label: 'AR Aging', icon: 'fa-scale-balanced' },
  { key: 'collection-plan', label: 'Collection Plan', icon: 'fa-calendar-check' },
  { key: 'daily-collection', label: 'Daily Collection', icon: 'fa-rotate' },
  { key: 'weekly-targets', label: 'Weekly Targets & Achievement', icon: 'fa-bullseye' },
  { key: 'high-risk', label: 'High Risk Companies', icon: 'fa-triangle-exclamation' },
  { key: 'dispute-management', label: 'Dispute Management', icon: 'fa-gavel' },
  { key: 'sla', label: 'SLA', icon: 'fa-stopwatch' },
];

const NARROW_QUERY = '(max-width: 900px)';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(NARROW_QUERY).matches);
  const [activeKey, setActiveKey] = useState<string>(NAV_ITEMS[0].key);
  const activeLabel = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activeKey)?.label ?? '',
    [activeKey]
  );

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={`${styles.sidebarHeader} ${collapsed ? styles.sidebarHeaderCollapsed : ''}`}>
          {!collapsed && <span className={styles.sidebarTitle}>Collection Networking</span>}
          <button
            className={styles.toggleBtn}
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className="fa-solid fa-bars" />
          </button>
        </div>

        <nav className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeKey === item.key ? styles.navItemActive : ''} ${
                collapsed ? styles.navItemCollapsed : ''
              }`}
              onClick={() => setActiveKey(item.key)}
              title={collapsed ? item.label : undefined}
            >
              <i className={`fa-solid ${item.icon} ${styles.navItemIcon}`} />
              {!collapsed && <span className={styles.navItemLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.contentArea}>
        <Topbar title={activeLabel} />
        <main className={styles.main}>
          {activeKey === 'ar-aging' && <ArAgingPage />}
          {activeKey === 'collection-plan' && <CollectionPlanPage />}
          {activeKey === 'daily-collection' && <ComingSoonPanel icon="fa-rotate" title="Daily Collection" />}
          {activeKey === 'weekly-targets' && (
            <ComingSoonPanel icon="fa-bullseye" title="Weekly Targets & Achievement" />
          )}
          {activeKey === 'high-risk' && (
            <ComingSoonPanel icon="fa-triangle-exclamation" title="High Risk Companies" />
          )}
          {activeKey === 'dispute-management' && (
            <ComingSoonPanel icon="fa-gavel" title="Dispute Management" />
          )}
          {activeKey === 'sla' && <ComingSoonPanel icon="fa-stopwatch" title="SLA" />}
        </main>
      </div>
    </div>
  );
}
