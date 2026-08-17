import { useEffect, useState } from 'react';
import { RegionPickerModal } from './RegionPickerModal';
import { RegionProvider } from '../../shared/RegionProvider';
import { useRegion } from '../../shared/regionContext';
import { REGION_OPTIONS } from '../../shared/region';
import { ThemeProvider } from '../../shared/ThemeProvider';
import { useTheme } from '../../shared/themeContext';
import { ComingSoonPanel } from './ComingSoonPanel';
import { ArAgingPage } from '../../features/ar-aging/ArAgingPage';
import { CollectionPlanPage } from '../../features/collection-plan/CollectionPlanPage';
import { ArVerificationPage } from '../../features/AR Verification/ArVerificationPage';
import { DisputeManagementPage } from '../../features/dispute-management/DisputeManagementPage';
import { BusinessPartnersPage } from '../../features/business-partners/BusinessPartnersPage';
import { PaymentTermsPage } from '../../features/payment-terms/PaymentTermsPage';
import { TmsHandoffPage } from '../../features/tms-handoff/TmsHandoffPage';

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'ar-aging', label: 'AR Aging', icon: 'fa-scale-balanced' },
  { key: 'collection-plan', label: 'Collection Plan', icon: 'fa-calendar-check' },
  { key: 'daily-collection', label: 'AR Verification', icon: 'fa-list-check' },
  { key: 'dispute-management', label: 'Dispute Management', icon: 'fa-gavel' },
  { key: 'business-partners', label: 'Business Partners', icon: 'fa-handshake' },
  { key: 'payment-terms', label: 'Payment Term', icon: 'fa-calendar-days' },
  { key: 'tms-handoff', label: 'TMS Hand Off', icon: 'fa-right-left' },
  { key: 'sla', label: 'SLA', icon: 'fa-stopwatch' },
];

const NARROW_QUERY = '(max-width: 900px)';

function SidebarFooter() {
  const { theme, toggleTheme } = useTheme();
  const { region, openPicker } = useRegion();
  const isDark = theme === 'dark';
  const regionOption = REGION_OPTIONS.find((opt) => opt.region === region);

  return (
    <div className="acc-sb-footer">
      <button className="acc-theme-toggle" onClick={openPicker} title="Change region">
        <span className="acc-theme-label">
          <i className="fa-solid fa-globe" />
          Region
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--shell-accent)' }}>
          {regionOption ? regionOption.code : '—'}
        </span>
      </button>
      <button className="acc-theme-toggle" onClick={toggleTheme} title="Toggle light / dark theme">
        <span className="acc-theme-label">
          <i className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`} />
          {isDark ? 'Dark' : 'Light'} mode
        </span>
        <i className={`fa-solid ${isDark ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
      </button>
    </div>
  );
}

function ShellInner() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(NARROW_QUERY).matches);
  const [activeKey, setActiveKey] = useState<string>(NAV_ITEMS[0].key);

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="acc-shell">
      <aside className={`acc-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="acc-sb-brand">
          <div className="acc-logo">
            <i className="fa-solid fa-file-invoice-dollar" />
            <span>
              Accounts
              <br />
              Receivable
            </span>
          </div>
          <button
            className="acc-sb-toggle"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
          >
            <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-bars'}`} />
          </button>
        </div>

        <ul className="acc-sb-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <a
                className={item.key === activeKey ? 'active' : ''}
                title={item.label}
                onClick={() => setActiveKey(item.key)}
              >
                <i className={`fa-solid ${item.icon}`} />
                <span className="acc-sb-label">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <SidebarFooter />
      </aside>

      <div className="acc-content-col">
        <main className="acc-main">
          {activeKey === 'ar-aging' && <ArAgingPage />}
          {activeKey === 'collection-plan' && <CollectionPlanPage />}
          {activeKey === 'daily-collection' && <ArVerificationPage />}
          {activeKey === 'dispute-management' && <DisputeManagementPage />}
          {activeKey === 'business-partners' && <BusinessPartnersPage />}
          {activeKey === 'payment-terms' && <PaymentTermsPage />}
          {activeKey === 'tms-handoff' && <TmsHandoffPage />}
          {activeKey === 'sla' && <ComingSoonPanel icon="fa-stopwatch" title="SLA" />}
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <ThemeProvider>
      <RegionProvider>
        <ShellInner />
        <RegionPickerModal />
      </RegionProvider>
    </ThemeProvider>
  );
}
