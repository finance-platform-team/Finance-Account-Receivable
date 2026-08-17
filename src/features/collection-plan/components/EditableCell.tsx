import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { fmt } from '../normalize';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type CellMode = 'instant' | 'dirty' | 'locked';

interface EditableCellProps {
  value: number;
  mode: CellMode;
  isGroupEnd?: boolean;
  isDirty?: boolean;
  onInstantSave: (value: number) => Promise<void>;
  onDirtyChange: (value: number, orig: number) => void;
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

export function EditableCell({ value, mode, isGroupEnd, isDirty, onInstantSave, onDirtyChange }: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const tdStyle: CSSProperties | undefined = isGroupEnd ? { borderRight: '1px dashed var(--line)' } : undefined;

  if (mode === 'locked') {
    return (
      <td className="acc-num" style={tdStyle}>
        <span
          title="Locked — plan already sent for this month"
          style={{
            display: 'inline-block',
            width: 88,
            padding: '5px 4px',
            color: 'var(--muted)',
            textAlign: 'right',
            fontSize: 13,
            cursor: 'not-allowed',
          }}
        >
          {fmt(value)}
        </span>
      </td>
    );
  }

  // Mirrors ref.html's native onchange (fires on blur/commit), not onInput
  // (fires per keystroke) — so saves/dirty-marks happen once, not per key.
  const handleBlur = async () => {
    const raw = inputRef.current?.value ?? '';
    const newValue = raw === '' ? 0 : Number(raw);

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
    <td className="acc-num" style={tdStyle} onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="number"
        step="any"
        defaultValue={value}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={inputStyle(saveState, mode === 'dirty' && !!isDirty)}
      />
    </td>
  );
}
