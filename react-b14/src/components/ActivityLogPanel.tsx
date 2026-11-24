import { useState, type FormEvent } from 'react';
import type { Application } from '../types';
import {
  addManualNote,
  formatDateTime,
  type ApplicationUpdater,
} from '../utils/warRoomHelpers';

interface ActivityLogPanelProps {
  application: Application;
  onUpdate: (updater: ApplicationUpdater) => void;
}

export function ActivityLogPanel({ application, onUpdate }: ActivityLogPanelProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Catatan tidak boleh kosong.');
      return;
    }
    onUpdate((app) => addManualNote(app, note));
    setNote('');
    setError('');
  };

  const logs = [...application.activityLogs].reverse();

  return (
    <div className="panel-box">
      <h3>Activity Log</h3>

      <form onSubmit={handleSubmit} className="checklist-form">
        <input
          type="text"
          className="text-input"
          placeholder="Tulis catatan manual Kapten..."
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError('');
          }}
        />
        <button type="submit" className="btn btn-primary">
          Simpan Catatan
        </button>
      </form>
      {error && <p className="error-inline">{error}</p>}

      <ul className="log-list">
        {logs.map((log) => (
          <li key={log.id} className="log-item">
            <span className="log-time">{formatDateTime(log.timestamp)}</span>
            <span>{log.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}