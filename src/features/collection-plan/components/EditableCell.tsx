import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { fmt } from '../normalize';
import { AMOUNT_MAX, clampNumber } from '../../../shared/validation';
import { Icon } from '../../../shared/components/Icon';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type CellMode = 'instant' | 'dirty' | 'locked';

interface EditableCellProps {
  value: number;
  mode: CellMode;
  isGroupEnd?: boolean;
  isDirty?: boolean;
  /** Open-dispute overlay — purely visual, doesn't affect editing. */
  flagged?: boolean;
  flagColor?: string;
  flagTitle?: string;
  onInstantSave: (value: number) => Promise<void>;
  onDirtyChange: (value: number, orig: number) => void;
}

// #rrggbb -> rgba(...) at the given alpha, for a light flag-tint background.
function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const BASE_INPUT_STYLE: CSSProperties = {
  width: 88,
  padding: '5px 4px',
  border: 'none',
  borderBottom: '1px solid var(--line)',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink)',
  textAlign: 'right',
  outline: 'none',
};

function inputStyle(saveState: SaveState, dirty: boolean): CSSProperties {
  if (saveState === 'saving') return { ...BASE_INPUT_STYLE, borderBottomColor: 'var(--gold)', background: 'var(--goldbg)' };
  if (saveState === 'saved') return { ...BASE_INPUT_STYLE, borderBottomColor: 'var(--ok)', background: 'var(--okbg)' };
  if (saveState === 'error') return { ...BASE_INPUT_STYLE, borderBottomColor: 'var(--bad)', background: 'var(--badbg)' };
  if (dirty) return { ...BASE_INPUT_STYLE, borderBottomColor: 'var(--gold)', background: 'var(--goldbg)' };
  return BASE_INPUT_STYLE;
}

export function EditableCell({
  value,
  mode,
  isGroupEnd,
  isDirty,
  flagged,
  flagColor,
  flagTitle,
  onInstantSave,
  onDirtyChange,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const tdStyle: CSSProperties | undefined = {
    ...(isGroupEnd ? { borderRight: '1px dashed var(--line)' } : {}),
    ...(flagged && flagColor ? { background: tint(flagColor, 0.14) } : {}),
  };
  const flagIcon = flagged && flagColor ? (
    <Icon className="fa-solid fa-flag" style={{ color: flagColor, fontSize: 10, flexShrink: 0 }} title={flagTitle} />
  ) : null;

  if (mode === 'locked') {
    return (
      <td className="acc-num" style={tdStyle} title={flagTitle}>
        <span
          title={flagTitle ? undefined : 'Locked — plan already sent for this month'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            width: 88,
            padding: '5px 4px',
            color: 'var(--muted)',
            textAlign: 'right',
            fontSize: 13,
            cursor: 'not-allowed',
          }}
        >
          {flagIcon}
          {fmt(value)}
        </span>
      </td>
    );
  }

  // Mirrors ref.html's native onchange (fires on blur/commit), not onInput
  // (fires per keystroke) — so saves/dirty-marks happen once, not per key.
  const handleBlur = async () => {
    const raw = inputRef.current?.value ?? '';
    const newValue = clampNumber(raw, AMOUNT_MAX);
    if (inputRef.current) inputRef.current.value = String(newValue);

    if (mode === 'instant') {
      if (newValue === value) return;
      setSaveState('saving');
      try {
        await onInstantSave(newValue);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1600);
      } catch {
        setSaveState('error');
      }
    } else {
      onDirtyChange(newValue, value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (inputRef.current) inputRef.current.value = String(value);
      setSaveState('idle');
      if (mode === 'dirty') onDirtyChange(value, value);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <td className="acc-num" style={tdStyle} title={flagTitle} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        {flagIcon}
        <input
          ref={inputRef}
          type="number"
          step="any"
          min={0}
          max={AMOUNT_MAX}
          defaultValue={value}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={inputStyle(saveState, mode === 'dirty' && !!isDirty)}
        />
      </div>
    </td>
  );
}
