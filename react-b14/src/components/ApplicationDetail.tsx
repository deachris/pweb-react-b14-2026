import type { Application } from '../types';
import { calculateSkillMatch } from '../utils/applicationHelpers';
import {
  daysSinceUpdate,
  formatDateTime,
  formatRupiah,
  isGhostingRisk,
  shiftLastUpdated,
  type ApplicationUpdater,
} from '../utils/warRoomHelpers';
import { StatusTransitionPanel } from './StatusTransitionPanel';
import { ChecklistPanel } from './ChecklistPanel';
import { ActivityLogPanel } from './ActivityLogPanel';
import { InterviewPrepTimer } from './InterviewPrepTimer';
import { StageTracker } from './StageTracker';

interface ApplicationDetailProps {
  application: Application;
  kaptenSkills: string[];
  onBack: () => void;
  onUpdate: (updater: ApplicationUpdater) => void;
  onDelete: () => void;
}

export function ApplicationDetail({
  application,
  kaptenSkills,
  onBack,
  onUpdate,
  onDelete,
}: ApplicationDetailProps) {
  const match = calculateSkillMatch(kaptenSkills, application.requiredSkills);
  const ghosting = isGhostingRisk(application);

  return (
    <section className="detail-section">
      <div className="detail-topbar">
        <button type="button" className="btn btn-sm btn-outline" onClick={onBack}>
          ← Kembali ke War Room
        </button>

        {(application.status === 'APPLIED' || application.status === 'SCREENING') && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onUpdate((app) => shiftLastUpdated(app, 15))}
          >
            Simulasi +15 Hari
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm btn-outline delete-application-button"
          onClick={onDelete}
        >
          Hapus Lamaran
        </button>
      </div>

      <div className="panel-box detail-header">
        <div className="detail-title-row">
          <div className="detail-avatar" aria-hidden="true">
            {application.company
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

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

      <div className="panel-box">
        <StageTracker status={application.status} />
      </div>

      <div className="detail-grid">
        <StatusTransitionPanel
          key={application.status}
          application={application}
          onUpdate={onUpdate}
        />
        <ChecklistPanel application={application} onUpdate={onUpdate} />
      </div>

      <InterviewPrepTimer key={application.id} />

      <ActivityLogPanel application={application} onUpdate={onUpdate} />
    </section>
  );
}