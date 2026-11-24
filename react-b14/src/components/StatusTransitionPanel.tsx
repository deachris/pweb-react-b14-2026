import { useState, type FormEvent } from 'react';
import type { Application, ApplicationStatus, WorkMode } from '../types';
import {
  STATUS_TRANSITIONS,
  applyTransition,
  validateTransition,
  type ApplicationUpdater,
  type TransitionInput,
} from '../utils/warRoomHelpers';

interface StatusTransitionPanelProps {
  application: Application;
  onUpdate: (updater: ApplicationUpdater) => void;
}

export function StatusTransitionPanel({
  application,
  onUpdate,
}: StatusTransitionPanelProps) {
  const options = STATUS_TRANSITIONS[application.status];
  const [target, setTarget] = useState<ApplicationStatus | ''>(options[0] ?? '');
  const [input, setInput] = useState<TransitionInput>({
    cvVersion: application.cvVersion ?? '',
    appliedDate: application.appliedDate ?? '',
    interviewDateTime: application.interviewDateTime ?? '',
    salaryOffer: application.salaryOffer ? String(application.salaryOffer) : '',
    workMode: application.workMode,
  });
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof TransitionInput>(
    key: K,
    value: TransitionInput[K]
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  if (options.length === 0) {
    return (
      <div className="panel-box">
        <h3>Perpindahan Status</h3>
        <p className="muted-text">
          Status {application.status} bersifat final dan tidak bisa diubah lagi.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;

    const message = validateTransition(application, target, input);
    if (message) {
      setError(message);
      return;
    }

    onUpdate((app) => applyTransition(app, target, input));
  };

  return (
    <div className="panel-box">
      <h3>Perpindahan Status</h3>
      <p className="muted-text">
        Dari {application.status}, lamaran bisa dipindah ke status berikut.
      </p>

      {error && <div className="alert-banner alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="transition-form" noValidate>
        <div className="form-group">
          <label htmlFor="target-status">Status Tujuan</label>
          <select
            id="target-status"
            className="text-input"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as ApplicationStatus);
              setError(null);
            }}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {target === 'APPLIED' && (
          <>
            <div className="form-group">
              <label htmlFor="tr-cv">Versi CV *</label>
              <input
                id="tr-cv"
                type="text"
                className="text-input"
                placeholder="Contoh: CV_Kapten_FE_v3.pdf"
                value={input.cvVersion}
                onChange={(e) => setField('cvVersion', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tr-date">Tanggal Melamar *</label>
              <input
                id="tr-date"
                type="date"
                className="text-input"
                value={input.appliedDate}
                onChange={(e) => setField('appliedDate', e.target.value)}
              />
            </div>
          </>
        )}

        {target === 'INTERVIEW' && (
          <div className="form-group">
            <label htmlFor="tr-interview">Jadwal Interview *</label>
            <input
              id="tr-interview"
              type="datetime-local"
              className="text-input"
              value={input.interviewDateTime}
              onChange={(e) => setField('interviewDateTime', e.target.value)}
            />
          </div>
        )}

        {target === 'OFFER' && (
          <>
            <div className="form-group">
              <label htmlFor="tr-salary">Gaji Penawaran (Rp) *</label>
              <input
                id="tr-salary"
                type="number"
                min="0"
                className="text-input"
                placeholder="Contoh: 5000000"
                value={input.salaryOffer}
                onChange={(e) => setField('salaryOffer', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tr-workmode">Mode Kerja *</label>
              <select
                id="tr-workmode"
                className="text-input"
                value={input.workMode}
                onChange={(e) => setField('workMode', e.target.value as WorkMode)}
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary">
          Perbarui Status
        </button>
      </form>
    </div>
  );
}