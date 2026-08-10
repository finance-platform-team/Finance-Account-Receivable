import { useCallback, useEffect, useState } from 'react';
import { Cfm_collectionplansubmissionsService } from '../../generated/services/Cfm_collectionplansubmissionsService';

function firstOfMonthISO(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString();
}

function submissionLabel(now: Date): string {
  return (
    'CollectionPlan-' +
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    now.toISOString().slice(11, 16).replace(':', '')
  );
}

interface SendResult {
  ok: boolean;
  isLate: boolean;
  error?: string;
}

interface UsePlanSubmissionLockResult {
  locked: boolean;
  submittedOn: string | null;
  checking: boolean;
  send: () => Promise<SendResult>;
}

export function usePlanSubmissionLock(): UsePlanSubmissionLockResult {
  const [locked, setLocked] = useState(false);
  const [submittedOn, setSubmittedOn] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(() => {
    const planPeriodISO = firstOfMonthISO(new Date());
    Cfm_collectionplansubmissionsService.getAll({
      filter: `cfm_planperiod eq ${planPeriodISO}`,
      orderBy: ['createdon desc'],
    })
      .then((result) => {
        if (!result.success) return;
        const existing = result.data ?? [];
        if (existing.length > 0) {
          setLocked(true);
          setSubmittedOn(existing[0].createdon ?? null);
        } else {
          setLocked(false);
          setSubmittedOn(null);
        }
      })
      .catch(() => {
        // Lock check failing shouldn't block the page — the plan just stays unlocked.
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const send = useCallback(async (): Promise<SendResult> => {
    if (locked) {
      return { ok: false, isLate: false, error: 'already-sent' };
    }
    const now = new Date();
    const planPeriodISO = firstOfMonthISO(now);
    const isLate = now.getDate() > 7;
    const result = await Cfm_collectionplansubmissionsService.create({
      cfm_name: submissionLabel(now),
      cfm_planperiod: planPeriodISO,
      cfm_islate: isLate,
      statecode: 0,
    });
    if (!result.success) {
      return { ok: false, isLate, error: result.error?.message ?? 'Send failed.' };
    }
    setLocked(true);
    setSubmittedOn(now.toISOString());
    return { ok: true, isLate };
  }, [locked]);

  return { locked, submittedOn, checking, send };
}
