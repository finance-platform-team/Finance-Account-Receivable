export type Region = 'EGY' | 'KSA';

// The "BU"/"Type"/"Entity" field (cfm_type on cfm_aragings, surfaced across
// AR Aging, Collection Plan and AR Verification) drives the Egypt/KSA split.
// Any BU code not in this list is treated as Egypt.
export const KSA_BU_CODES: readonly string[] = ['AFW', 'AHJ', 'AKW', 'ALW', 'LCH', 'MKR', 'ADC', 'SNB'];

const KSA_BU_SET = new Set(KSA_BU_CODES.map((code) => code.toUpperCase()));

export function regionForBu(bu: string | null | undefined): Region {
  const code = (bu ?? '').trim().toUpperCase();
  return code && KSA_BU_SET.has(code) ? 'KSA' : 'EGY';
}

export interface RegionOption {
  region: Region;
  code: string;
  name: string;
  sub: string;
}

export const REGION_OPTIONS: RegionOption[] = [
  { region: 'EGY', code: 'EG', name: 'Egypt', sub: 'Everything outside the KSA business units' },
  { region: 'KSA', code: 'KSA', name: 'Saudi Arabia', sub: KSA_BU_CODES.join(', ') },
];

export const REGION_STORAGE_KEY = 'ar-pulse.region';
