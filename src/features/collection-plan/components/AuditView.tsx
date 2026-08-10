import styles from '../CollectionPlan.module.css';

// cfm_manualentryaudits (the table ref.html reads/writes for this tab) isn't a
// connected data source in this Code App yet — see power.config.json's
// databaseReferences. This renders the real chrome (KPIs, filters, column
// headers) so the tab reads as a real page, with a clear state explaining
// what's missing instead of fabricating data.
const MISSING_TABLE = 'cfm_manualentryaudits';

export function AuditView() {
  return (
    <div>
      <div className={`${styles.kpiWrap} ${styles.kpiWrapAudit}`}>
        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}>
              <i className="fa-solid fa-pen-to-square" />
            </div>
            <div className={styles.kpiLabel}>Total Changes</div>
          </div>
          <div className={styles.kpiValue}>0</div>
          <div className={styles.kpiSub}>Logged field-level edits</div>
        </div>
        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconInfo}`}>
              <i className="fa-solid fa-building" />
            </div>
            <div className={styles.kpiLabel}>Companies Affected</div>
          </div>
          <div className={styles.kpiValue}>0</div>
          <div className={styles.kpiSub}>Distinct companies touched</div>
        </div>
        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
              <i className="fa-solid fa-user-group" />
            </div>
            <div className={styles.kpiLabel}>Team Members</div>
          </div>
          <div className={styles.kpiValue}>0</div>
          <div className={styles.kpiSub}>Distinct people who edited</div>
        </div>
        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconWarn}`}>
              <i className="fa-solid fa-tags" />
            </div>
            <div className={styles.kpiLabel}>Most Edited Field</div>
          </div>
          <div className={styles.kpiValue} style={{ fontSize: 15 }}>
            —
          </div>
          <div className={styles.kpiSub}>No data yet</div>
        </div>
      </div>

      <div className={styles.tblShell}>
        <div className={styles.tblHdrRow}>
          <div className={styles.filterInlineBar}>
            <div className={styles.filterInlineSearch}>
              <i className="fa-solid fa-magnifying-glass" />
              <input type="text" placeholder="Search company, code, or user…" disabled />
            </div>
            <div className={styles.selectWrap}>
              <i className={`fa-solid fa-tags ${styles.selectIcon}`} />
              <select className={styles.fieldInput} disabled defaultValue="">
                <option value="">All Fields</option>
              </select>
              <span className={styles.selArrow}>
                <i className="fa-solid fa-chevron-down" />
              </span>
            </div>
            <div className={styles.selectWrap}>
              <i className={`fa-solid fa-user ${styles.selectIcon}`} />
              <select className={styles.fieldInput} disabled defaultValue="">
                <option value="">All Users</option>
              </select>
              <span className={styles.selArrow}>
                <i className="fa-solid fa-chevron-down" />
              </span>
            </div>
            <input type="date" className={styles.dateInput} title="From date" disabled />
            <input type="date" className={styles.dateInput} title="To date" disabled />
            <label className={styles.groupToggle}>
              <input type="checkbox" disabled />
              <span>Group by Company</span>
            </label>
            <button className={styles.filterClear} disabled>
              <i className="fa-solid fa-xmark" /> Clear
            </button>
          </div>
          <div className={styles.tblCount}>
            <i className="fa-solid fa-table" />
            Showing <strong>0</strong> of <strong>0</strong> changes
          </div>
        </div>

        <div className={styles.tblScroll}>
          <table className={styles.auTbl}>
            <thead>
              <tr>
                <th>
                  <i className="fa-solid fa-clock" />
                  Date &amp; Time
                </th>
                <th>
                  <i className="fa-solid fa-briefcase" />
                  Company
                </th>
                <th>
                  <i className="fa-solid fa-hashtag" />
                  Code
                </th>
                <th>
                  <i className="fa-solid fa-building" />
                  Type
                </th>
                <th>
                  <i className="fa-solid fa-tags" />
                  Field
                </th>
                <th>
                  <i className="fa-solid fa-right-left" />
                  Old → New
                </th>
                <th>
                  <i className="fa-solid fa-user" />
                  Changed By
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className={styles.stateCell}>
                  <div className={`${styles.stateIcon} ${styles.stateIconError}`}>
                    <i className="fa-solid fa-plug-circle-xmark" />
                  </div>
                  <div className={styles.stateTitle}>Data source not connected</div>
                  <div className={styles.stateMsg}>
                    This tab reads and writes <code>{MISSING_TABLE}</code>, which isn&apos;t one of this Code App&apos;s
                    connected Dataverse tables yet. Add it via <code>pac code add-data-source</code> (or the Data
                    panel in Power Apps Studio) and regenerate the typed services to bring this tab online.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
