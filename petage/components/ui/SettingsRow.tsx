/**
 * Reusable settings row for the settings page.
 * Displays a label with an optional value or chevron indicator.
 */

interface SettingsRowProps {
  label: string;
  value?: string;
  /** When true, shows a chevron to indicate the row is tappable. */
  action?: boolean;
}

export default function SettingsRow({
  label,
  value,
  action = false,
}: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[14px] text-text-primary">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-body-sm text-text-secondary">{value}</span>
        )}
        {action && (
          <span className="text-text-tertiary text-[16px]">›</span>
        )}
      </div>
    </div>
  );
}
