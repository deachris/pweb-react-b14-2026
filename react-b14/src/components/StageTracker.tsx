import type { ApplicationStatus } from '../types';

const STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'WISHLIST', label: 'Wishlist' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'SCREENING', label: 'Screening' },
  { status: 'INTERVIEW', label: 'Interview' },
  { status: 'OFFER', label: 'Offer' },
];

export function StageTracker({ status }: { status: ApplicationStatus }) {
  const current = STAGES.findIndex((s) => s.status === status);

  return (
    <section className="stage-section" aria-label="Tahap Seleksi">
      <h3 className="stage-title">Tahap Seleksi</h3>
      <ol className="stage-tracker">
        {STAGES.map((stage, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo';
          return (
            <li
              key={stage.status}
              className={`stage-step stage-${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {i + 1}. {stage.label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}