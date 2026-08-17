import { createContext, useContext } from 'react';
import type { Region } from './region';

export interface RegionContextValue {
  region: Region | null;
  pickerOpen: boolean;
  setRegion: (region: Region) => void;
  openPicker: () => void;
  closePicker: () => void;
}

export const RegionContext = createContext<RegionContextValue | null>(null);

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return ctx;
}
