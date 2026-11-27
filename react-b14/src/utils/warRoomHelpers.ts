import type { Application, ApplicationStatus, WorkMode } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const GHOSTING_THRESHOLD_DAYS = 14;

export type ApplicationUpdater = (app: Application) => Application;

export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
};

export const ALL_STATUSES = Object.keys(STATUS_TRANSITIONS) as ApplicationStatus[];

const GHOSTING_TRACKED: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
];

function toTime(value?: string): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function formatDateTime(value: string): string {
  const time = toTime(value);
  if (time === null) return value;
  return new Date(time).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function daysSinceUpdate(app: Application, now = Date.now()): number {
  const updated = toTime(app.lastUpdatedAt) ?? now;
  return Math.floor((now - updated) / DAY_MS);
}

export function isGhostingRisk(app: Application, now = Date.now()): boolean {
  if (!GHOSTING_TRACKED.includes(app.status)) return false;
  const updated = toTime(app.lastUpdatedAt);
  if (updated === null) return false;
  return now - updated > GHOSTING_THRESHOLD_DAYS * DAY_MS;
}

export function shiftLastUpdated(app: Application, days: number): Application {
  const updated = toTime(app.lastUpdatedAt) ?? Date.now();
  return {
    ...app,
    lastUpdatedAt: new Date(updated - days * DAY_MS).toISOString(),
  };
}

const MINUTE_MS = 60 * 1000;
export const CONFLICT_THRESHOLD_MINUTES = 60;

export type SortOption = 'newest' | 'interview' | 'offer';

export interface WarRoomFilters {
  keyword: string;
  status: ApplicationStatus | 'ALL';
  ghostingOnly: boolean;
  sort: SortOption;
}


function compareInterview(a: Application, b: Application, now: number): number {
  const timeA = toTime(a.interviewDateTime);
  const timeB = toTime(b.interviewDateTime);

  if (timeA === null && timeB === null) return 0;
  if (timeA === null) return 1;
  if (timeB === null) return -1;

  const upcomingA = timeA >= now;
  const upcomingB = timeB >= now;

  if (upcomingA !== upcomingB) {
    return upcomingA ? -1 : 1;
  }

  if (upcomingA) {
    return timeA - timeB;
  }

  return timeB - timeA;
}


export function filterAndSortApplications(
  applications: Application[],
  filters: WarRoomFilters,
  now = Date.now()
): Application[] {
  const keyword = filters.keyword.trim().toLowerCase();

  const filtered = applications.filter((app) => {
    const matchesKeyword =
      keyword === '' ||
      app.company.toLowerCase().includes(keyword) ||
      app.role.toLowerCase().includes(keyword) ||
      app.requiredSkills.some((skill) => skill.toLowerCase().includes(keyword));
    const matchesStatus = filters.status === 'ALL' || app.status === filters.status;
    const matchesGhosting = !filters.ghostingOnly || isGhostingRisk(app, now);
    return matchesKeyword && matchesStatus && matchesGhosting;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'interview') return compareInterview(a, b, now);
    if (filters.sort === 'offer') {
      return (b.salaryOffer ?? -1) - (a.salaryOffer ?? -1);
    }
    return (toTime(b.lastUpdatedAt) ?? 0) - (toTime(a.lastUpdatedAt) ?? 0);
  });
}

export interface InterviewConflict {
  first: Application;
  second: Application;
  gapMinutes: number;
}

export function findInterviewConflicts(applications: Application[]): InterviewConflict[] {
  const scheduled = applications
    .filter((app) => app.status === 'INTERVIEW' && toTime(app.interviewDateTime) !== null)
    .sort(
      (a, b) =>
        (toTime(a.interviewDateTime) as number) - (toTime(b.interviewDateTime) as number)
    );

  const conflicts: InterviewConflict[] = [];
  for (let i = 0; i < scheduled.length - 1; i++) {
    const gap =
      (toTime(scheduled[i + 1].interviewDateTime) as number) -
      (toTime(scheduled[i].interviewDateTime) as number);
    if (gap < CONFLICT_THRESHOLD_MINUTES * MINUTE_MS) {
      conflicts.push({
        first: scheduled[i],
        second: scheduled[i + 1],
        gapMinutes: Math.round(gap / MINUTE_MS),
      });
    }
  }
  return conflicts;
}

export function getChecklistProgress(app: Application) {
  const total = app.checklist.length;
  const done = app.checklist.filter((item) => item.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export interface TransitionInput {
  cvVersion: string;
  appliedDate: string;
  interviewDateTime: string;
  salaryOffer: string;
  workMode: WorkMode;
}

export function validateTransition(
  app: Application,
  target: ApplicationStatus,
  input: TransitionInput
): string | null {
  if (!STATUS_TRANSITIONS[app.status].includes(target)) {
    return `Perpindahan status ${app.status} → ${target} tidak diizinkan.`;
  }

  if (target === 'APPLIED') {
    if (!input.cvVersion.trim()) return 'Versi CV wajib diisi untuk status APPLIED.';
    if (!input.appliedDate) return 'Tanggal melamar wajib diisi untuk status APPLIED.';
  }

  if (target === 'INTERVIEW') {
    if (!input.interviewDateTime || toTime(input.interviewDateTime) === null) {
      return 'Tanggal dan jam interview wajib diisi untuk status INTERVIEW.';
    }
  }

  if (target === 'OFFER') {
    const salary = Number(input.salaryOffer);
    if (!input.salaryOffer || Number.isNaN(salary) || salary <= 0) {
      return 'Gaji penawaran harus lebih dari 0 untuk status OFFER.';
    }
    if (!input.workMode) return 'Mode kerja wajib dipilih untuk status OFFER.';
  }

  return null;
}

export function appendLog(
  app: Application,
  message: string,
  timestamp = new Date().toISOString()
): Application {
  return {
    ...app,
    activityLogs: [
      ...app.activityLogs,
      { id: crypto.randomUUID(), timestamp, message },
    ],
  };
}

export function applyTransition(
  app: Application,
  target: ApplicationStatus,
  input: TransitionInput
): Application {
  const nowIso = new Date().toISOString();
  const patch: Partial<Application> = {};

  if (target === 'APPLIED') {
    patch.cvVersion = input.cvVersion.trim();
    patch.appliedDate = input.appliedDate;
  }
  if (target === 'INTERVIEW') {
    patch.interviewDateTime = input.interviewDateTime;
  }
  if (target === 'OFFER') {
    patch.salaryOffer = Number(input.salaryOffer);
    patch.workMode = input.workMode;
  }

  return appendLog(
    { ...app, ...patch, status: target, lastUpdatedAt: nowIso },
    `Status berubah dari ${app.status} ke ${target}.`,
    nowIso
  );
}

export function addChecklistItem(app: Application, text: string): Application {
  const item = { id: crypto.randomUUID(), text: text.trim(), done: false };
  return appendLog(
    { ...app, checklist: [...app.checklist, item] },
    `Item checklist ditambahkan: "${item.text}".`
  );
}

export function toggleChecklistItem(app: Application, itemId: string): Application {
  const target = app.checklist.find((item) => item.id === itemId);
  if (!target) return app;

  return appendLog(
    {
      ...app,
      checklist: app.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    },
    `Item checklist "${target.text}" ${target.done ? 'dibuka kembali' : 'diselesaikan'}.`
  );
}

export function removeChecklistItem(app: Application, itemId: string): Application {
  const target = app.checklist.find((item) => item.id === itemId);
  if (!target) return app;

  return appendLog(
    { ...app, checklist: app.checklist.filter((item) => item.id !== itemId) },
    `Item checklist dihapus: "${target.text}".`
  );
}

export function addManualNote(app: Application, note: string): Application {
  return appendLog(app, `Catatan Kapten: ${note.trim()}`);
}