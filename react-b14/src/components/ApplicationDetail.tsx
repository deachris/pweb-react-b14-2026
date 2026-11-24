import type { Application } from '../types';
import { calculateSkillMatch } from '../utils/applicationHelpers';
import {
  daysSinceUpdate,
  formatDateTime,
  formatRupiah,
  isGhostingRisk,
  type ApplicationUpdater,
} from '../utils/warRoomHelpers';
import { StatusTransitionPanel } from './StatusTransitionPanel';
import { ChecklistPanel } from './ChecklistPanel';
import { ActivityLogPanel } from './ActivityLogPanel';

interface ApplicationDetailProps {
  application: Application;
  kaptenSkills: string[];
  onBack: () => void;
  onUpdate: (updater: ApplicationUpdater) => void;
}

export function ApplicationDetail({
  application,
  kaptenSkills,
  onBack,
  onUpdate,
}: ApplicationDetailProps) {
  const match = calculateSkillMatch(kaptenSkills, application.requiredSkills);
  const ghosting = isGhostingRisk(application);

  return (
    <section className="detail-section">
      <button type="button" className="btn btn-sm btn-outline" onClick={onBack}>
        ← Kembali ke War Room
      </button>

      <div className="panel-box detail-header">
        <div>
          <div className="detail-badges">
            <span className={`status-badge status-${application.status.toLowerCase()}`}>
              {application.status}
            </span>
            {ghosting && (
              <span className="badge-score badge-low">
                Rawan Ghosting · {daysSinceUpdate(application)} hari tanpa perubahan
              </span>
            )}
          </div>
          <h2>{application.role}</h2>
          <p className="card-company">{application.company}</p>
          <p className="card-meta">
            {application.workMode} • CV: <strong>{application.cvVersion ?? '-'}</strong>
            {application.appliedDate && ` • Melamar: ${application.appliedDate}`}
          </p>
          {application.interviewDateTime && (
            <p className="muted-text">
              Interview: {formatDateTime(application.interviewDateTime)}
            </p>
          )}
          {application.salaryOffer !== undefined && (
            <p className="muted-text">
              Penawaran: {formatRupiah(application.salaryOffer)}
            </p>
          )}
        </div>

        <div className="detail-match">
          <span className="stat-pill">
            Skill Match <strong>{match.score}%</strong>
          </span>
          <div className="tag-list">
            {match.matchedSkills.map((skill) => (
              <span key={skill} className="tag tag-matched">
                ✓ {skill}
              </span>
            ))}
            {match.missingSkills.map((skill) => (
              <span key={skill} className="tag tag-missing">
                ! {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <StatusTransitionPanel
          key={application.status}
          application={application}
          onUpdate={onUpdate}
        />
        <ChecklistPanel application={application} onUpdate={onUpdate} />
      </div>

      <ActivityLogPanel application={application} onUpdate={onUpdate} />
    </section>
  );
}