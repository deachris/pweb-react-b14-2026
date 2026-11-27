import { useState } from 'react';
import type { Application, ApplicationStatus } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { calculateSkillMatch } from '../utils/applicationHelpers';
import {
  ALL_STATUSES,
  daysSinceUpdate,
  filterAndSortApplications,
  findInterviewConflicts,
  formatDateTime,
  formatRupiah,
  getChecklistProgress,
  isGhostingRisk,
  type ApplicationUpdater,
  type SortOption,
} from '../utils/warRoomHelpers';
import { ApplicationDetail } from './ApplicationDetail';

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  onUpdateApplication: (id: string, updater: ApplicationUpdater) => void;
  onDeleteApplication: (id: string) => void;
}

export function WarRoom({
  applications,
  kaptenSkills,
  onUpdateApplication,
  onDeleteApplication,
}: WarRoomProps) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 400);
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [ghostingOnly, setGhostingOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = Date.now();

  const selectedApp = applications.find((app) => app.id === selectedId);

   if (selectedApp) {                                                      
    return (
      <ApplicationDetail
        application={selectedApp}
        kaptenSkills={kaptenSkills}
        onBack={() => setSelectedId(null)}
        onUpdate={(updater) => onUpdateApplication(selectedApp.id, updater)}
        onDelete={() => {onDeleteApplication(selectedApp.id); setSelectedId(null);}}
      />
    );
  }

  const conflicts = findInterviewConflicts(applications);
  const ghostingCount = applications.filter((app) => isGhostingRisk(app, now)).length;
  const visibleApps = filterAndSortApplications(
    applications,
    { keyword: debouncedKeyword, status, ghostingOnly, sort },
    now
  );

  return (
    <section className="warroom-section">
      {conflicts.length > 0 && (
        <div className="alert-banner conflict-banner" role="alert">
          <strong>Bentrok Jadwal Interview!</strong>
          <ul>
            {conflicts.map(({ first, second, gapMinutes }) => (
              <li key={`${first.id}-${second.id}`}>
                {first.company} ({formatDateTime(first.interviewDateTime ?? '')}) dan{' '}
                {second.company} ({formatDateTime(second.interviewDateTime ?? '')}) hanya
                berselisih {gapMinutes} menit.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-box warroom-toolbar">
        <div className="warroom-filters">
          <input
            type="search"
            className="text-input search-bar"
            placeholder="Cari perusahaan, posisi, atau skill..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <select
            className="text-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'ALL')}
            aria-label="Filter status"
          >
            <option value="ALL">Semua Status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="text-input"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Urutkan"
          >
            <option value="newest">Terbaru</option>
            <option value="interview">Jadwal Interview Terdekat</option>
            <option value="offer">Offer Tertinggi</option>
          </select>
        </div>

        <div className="warroom-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={ghostingOnly}
              onChange={(e) => setGhostingOnly(e.target.checked)}
            />
            Hanya Rawan Ghosting ({ghostingCount})
          </label>
        </div>
      </div>

      {applications.length === 0 && (
        <div className="state-box">
          <h3>Belum Ada Lamaran</h3>
          <p className="muted-text">
            Simpan lowongan dari katalog atau tambahkan lamaran lewat Input Manual.
          </p>
        </div>
      )}

      {applications.length > 0 && visibleApps.length === 0 && (
        <div className="state-box">
          <h3>Tidak Ada Lamaran yang Cocok</h3>
          <p className="muted-text">Ubah pencarian atau filter yang sedang aktif.</p>
        </div>
      )}

      {visibleApps.length > 0 && (
        <div className="catalog-grid">
          {visibleApps.map((app) => {
            const match = calculateSkillMatch(kaptenSkills, app.requiredSkills);
            const { done, total } = getChecklistProgress(app);
            const ghosting = isGhostingRisk(app, now);

            return (
              <article key={app.id} className="catalog-card">
                <div className="card-header">
                  <span className={`status-badge status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                  {ghosting && (
                    <span className="badge-score badge-low">
                      Rawan Ghosting · {daysSinceUpdate(app, now)} hari
                    </span>
                  )}
                </div>

                <div className="card-body">
                  <h3 className="card-title">{app.role}</h3>
                  <p className="card-company">{app.company}</p>
                  <p className="card-meta">
                    {app.workMode} • CV: <strong>{app.cvVersion ?? '-'}</strong>
                  </p>

                  <div className="card-stats">
                    <span className="stat-pill">
                      Skill Match <strong>{match.score}%</strong>
                    </span>
                    <span className="stat-pill">
                      Checklist{' '}
                      <strong>
                        {done}/{total}
                      </strong>
                    </span>
                  </div>

                  {(app.interviewDateTime || app.salaryOffer !== undefined) && (
                    <div className="card-schedule">
                      {app.interviewDateTime && (
                        <p className="muted-text-sm">
                          Interview: {formatDateTime(app.interviewDateTime)}
                        </p>
                      )}
                      {app.salaryOffer !== undefined && (
                        <p className="muted-text-sm">
                          Offer: {formatRupiah(app.salaryOffer)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="card-footer">
                    <button
                      type="button"
                      className="btn btn-full btn-primary"
                      onClick={() => setSelectedId(app.id)}
                    >
                      Kelola Lamaran
                    </button>

                    <button
                      type="button"
                      className="btn btn-full btn-outline delete-application-button"
                      onClick={() => onDeleteApplication(app.id)}
                    >
                      Hapus Lamaran
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}