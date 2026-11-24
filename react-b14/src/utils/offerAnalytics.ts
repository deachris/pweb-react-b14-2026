import type {
  Application,
  ApplicationStatus,
  WorkMode,
} from '../types';

import { calculateSkillMatch } from './applicationHelpers';

const DAY_MS = 24 * 60 * 60 * 1000;

const RESPONSE_STATUSES: ApplicationStatus[] = [
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
];

const MODE_SCORES: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export function isDashboardGhostingRisk(
  application: Application,
  now = Date.now(),
) {
  return (
    (
      application.status === 'APPLIED' ||
      application.status === 'SCREENING'
    ) &&
    now - new Date(application.lastUpdatedAt).getTime() >
      14 * DAY_MS
  );
}

export function getApplicationStats(
  applications: Application[],
) {
  const submitted = applications.filter(
    (application) => application.status !== 'WISHLIST',
  );

  const responses = submitted.filter((application) =>
    RESPONSE_STATUSES.includes(application.status),
  );

  const interviews = submitted.filter(
    (application) =>
      application.status === 'INTERVIEW' ||
      application.status === 'OFFER',
  );

  function percent(count: number) {
    if (submitted.length === 0) return 0;

    return Math.round(
      (count / submitted.length) * 100,
    );
  }

  return {
    total: applications.length,
    responseRate: percent(responses.length),
    interviewRate: percent(interviews.length),

    ghosting: applications.filter((application) =>
      isDashboardGhostingRisk(application),
    ).length,

    offers: applications.filter(
      (application) => application.status === 'OFFER',
    ).length,
  };
}

export function calculateOfferScore(
  application: Application,
  kaptenSkills: string[],
  highestSelectedSalary: number,
) {
  const salary = Math.max(
    0,
    application.salaryOffer ?? 0,
  );

  const normalizedSalary =
    highestSelectedSalary > 0
      ? (salary / highestSelectedSalary) * 100
      : 0;

  const workModeScore =
    MODE_SCORES[application.workMode];

  const skillMatch = calculateSkillMatch(
    kaptenSkills,
    application.requiredSkills,
  ).score;

  const total =
    normalizedSalary * 0.5 +
    workModeScore * 0.25 +
    skillMatch * 0.25;

  return {
    salary,
    normalizedSalary,
    workModeScore,
    skillMatch,
    total,
  };
}