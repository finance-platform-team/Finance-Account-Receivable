interface ComingSoonPanelProps {
  icon: string;
  title: string;
}

export function ComingSoonPanel({ icon, title }: ComingSoonPanelProps) {
  return (
    <div className="acc-wrap">
      <div className="acc-state">
        <i className={`fa-solid ${icon}`} />
        {title}
        <br />
        <small>This page isn&apos;t built yet.</small>
      </div>
    </div>
  );
}
