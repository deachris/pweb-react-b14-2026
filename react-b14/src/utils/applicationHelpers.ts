import type { Application, SkillMatchResult, WorkMode } from '../types';

export function calculateSkillMatch(
  kaptenSkills: string[],
  requiredSkills: string[]
): SkillMatchResult {
  if (requiredSkills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [] };
  }

  const normalizedUserSkills = new Set(
    kaptenSkills.map((skill) => skill.trim().toLowerCase())
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of requiredSkills) {
    if (normalizedUserSkills.has(reqSkill.trim().toLowerCase())) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return { score, matchedSkills, missingSkills };
}

export function isDuplicateApplication(
  applications: Application[],
  company: string,
  role: string
): boolean {
  const targetCompany = company.trim().toLowerCase();
  const targetRole = role.trim().toLowerCase();

  return applications.some(
    (app) =>
      app.company.trim().toLowerCase() === targetCompany &&
      app.role.trim().toLowerCase() === targetRole
  );
}

export function inferWorkMode(location: string): WorkMode {
  const lower = location.toLowerCase();
  if (lower.includes('hybrid')) return 'Hybrid';
  if (lower.includes('onsite') || lower.includes('on-site')) return 'Onsite';
  return 'Remote';
}