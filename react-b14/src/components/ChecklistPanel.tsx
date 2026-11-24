import { useState, type FormEvent } from 'react';
import type { Application } from '../types';
import {
  addChecklistItem,
  getChecklistProgress,
  removeChecklistItem,
  toggleChecklistItem,
  type ApplicationUpdater,
} from '../utils/warRoomHelpers';

interface ChecklistPanelProps {
  application: Application;
  onUpdate: (updater: ApplicationUpdater) => void;
}

export function ChecklistPanel({ application, onUpdate }: ChecklistPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const { done, total, percent } = getChecklistProgress(application);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Teks checklist tidak boleh kosong.');
      return;
    }
    onUpdate((app) => addChecklistItem(app, text));
    setText('');
    setError('');
  };

  return (
    <div className="panel-box">
      <div className="checklist-header">
        <h3>Checklist Persiapan</h3>
        <strong>
          {done}/{total}
        </strong>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="muted-text-sm">{percent}% selesai</p>

      <form onSubmit={handleSubmit} className="checklist-form">
        <input
          type="text"
          className="text-input"
          placeholder="Tambah item, misal: Latihan soal LeetCode"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
        />
        <button type="submit" className="btn btn-primary">
          Tambah
        </button>
      </form>
      {error && <p className="error-inline">{error}</p>}

      {total === 0 ? (
        <p className="muted-text">Belum ada item checklist.</p>
      ) : (
        <ul className="checklist-list">
          {application.checklist.map((item) => (
            <li key={item.id} className="checklist-item">
              <label className={item.done ? 'checklist-done' : ''}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onUpdate((app) => toggleChecklistItem(app, item.id))}
                />
                {item.text}
              </label>
              <button
                type="button"
                className="chip-remove-btn"
                aria-label={`Hapus ${item.text}`}
                onClick={() => onUpdate((app) => removeChecklistItem(app, item.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}