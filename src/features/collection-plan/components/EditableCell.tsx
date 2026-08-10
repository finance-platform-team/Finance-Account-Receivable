import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import styles from '../CollectionPlan.module.css';
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

export function EditableCell({ value, mode, isGroupEnd, isDirty, onInstantSave, onDirtyChange }: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const tdClass = isGroupEnd ? `${styles.numeric} ${styles.colGroupEnd}` : styles.numeric;

  if (mode === 'locked') {
    return (
      <td className={tdClass}>
        <span className={styles.cellLocked} title="Locked — plan already sent for this month">
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

  const inputClass = [
    styles.cellInput,
    saveState === 'saving' && styles.cellInputSaving,
    saveState === 'saved' && styles.cellInputSaved,
    saveState === 'error' && styles.cellInputError,
    mode === 'dirty' && isDirty && styles.cellInputDirty,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td className={tdClass}>
      <span className={styles.cellEditWrap}>
        <i className={`fa-solid fa-pen ${styles.editHint}`} />
        <input
          ref={inputRef}
          className={inputClass}
          type="number"
          step="any"
          defaultValue={value}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </span>
    </td>
  );
}
