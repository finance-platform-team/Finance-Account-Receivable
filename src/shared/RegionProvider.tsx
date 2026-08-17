import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { RegionContext } from './regionContext';
import { REGION_STORAGE_KEY } from './region';
import type { Region } from './region';

function loadStoredRegion(): Region | null {
  try {
    const raw = window.localStorage.getItem(REGION_STORAGE_KEY);
    return raw === 'EGY' || raw === 'KSA' ? raw : null;
  } catch {
    return null;
  }
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region | null>(loadStoredRegion);
  // No stored region yet -> gate the app behind the picker on first load.
  const [pickerOpen, setPickerOpen] = useState<boolean>(() => loadStoredRegion() === null);

  const setRegion = useCallback((next: Region) => {
    setRegionState(next);
    setPickerOpen(false);
    try {
      window.localStorage.setItem(REGION_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. private browsing) — region just won't persist across reloads.
    }
  }, []);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  return (
    <RegionContext.Provider value={{ region, pickerOpen, setRegion, openPicker, closePicker }}>
      {children}
    </RegionContext.Provider>
  );
}
