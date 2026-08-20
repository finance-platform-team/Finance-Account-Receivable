import { useEffect, useState } from 'react';
import { RegionPickerModal } from './RegionPickerModal';
import { RegionProvider } from '../../shared/RegionProvider';
import { useRegion } from '../../shared/regionContext';
import { REGION_OPTIONS } from '../../shared/region';
import { ThemeProvider } from '../../shared/ThemeProvider';
import { useTheme } from '../../shared/themeContext';
import { ArAgingPage } from '../../features/ar-aging/ArAgingPage';
import { CollectionPlanPage } from '../../features/collection-plan/CollectionPlanPage';
import { ArVerificationPage } from '../../features/AR Verification/ArVerificationPage';
import { DisputeManagementPage } from '../../features/dispute-management/DisputeManagementPage';
import { BusinessPartnersPage } from '../../features/business-partners/BusinessPartnersPage';
import { PaymentTermsPage } from '../../features/payment-terms/PaymentTermsPage';
import { TmsHandoffPage } from '../../features/tms-handoff/TmsHandoffPage';
import { SlaPage } from '../../features/sla/SlaPage';
import { TreasuryWorkflowPage } from '../../features/treasury-workflow/TreasuryWorkflowPage';

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
  { key: 'treasury-workflow', label: 'Treasury Workflow', icon: 'fa-building-columns' },
];

const NARROW_QUERY = '(max-width: 900px)';
const MOBILE_QUERY = '(max-width: 760px)';

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
  // Two independent concerns: desktop icon-rail collapse (>=761px, sidebar
  // stays visible, just narrower) vs mobile off-canvas drawer (<=760px,
  // sidebar is fully hidden until opened). Conflating these into one boolean
  // used to leave the sidebar permanently off-screen with no way to reopen it
  // on phones — the toggle button lived inside the very panel it hid.
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => window.matchMedia(NARROW_QUERY).matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [activeKey, setActiveKey] = useState<string>(NAV_ITEMS[0].key);

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setDesktopCollapsed(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      // Crossing back to desktop width with the drawer open would otherwise
      // leave `mobile-open` set and fight the desktop layout on the next
      // narrow-again transition.
      if (!e.matches) setMobileOpen(false);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else setDesktopCollapsed((v) => !v);
  };

  const handleSelectNav = (key: string) => {
    setActiveKey(key);
    if (isMobile) setMobileOpen(false);
  };

  return (
    <div className="acc-shell">
      <div className="acc-mobile-topbar">
        <button className="acc-mobile-menu-btn" title="Open menu" onClick={() => setMobileOpen(true)}>
          <i className="fa-solid fa-bars" />
        </button>
        <div className="acc-logo">
          <i className="fa-solid fa-file-invoice-dollar" />
          <span>Accounts Receivable</span>
        </div>
      </div>

      <div className={`acc-scrim-mobile${mobileOpen ? ' on' : ''}`} onClick={() => setMobileOpen(false)} />

      <aside className={`acc-sidebar${desktopCollapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
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
            title={isMobile ? 'Close menu' : desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={handleToggleSidebar}
          >
            <i className={`fa-solid ${isMobile ? 'fa-xmark' : desktopCollapsed ? 'fa-angles-right' : 'fa-bars'}`} />
          </button>
        </div>

        <ul className="acc-sb-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <a
                className={item.key === activeKey ? 'active' : ''}
                title={item.label}
                onClick={() => handleSelectNav(item.key)}
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
          {activeKey === 'sla' && <SlaPage />}
          {activeKey === 'treasury-workflow' && <TreasuryWorkflowPage />}
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
