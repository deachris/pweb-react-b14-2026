import { useEffect, useRef, useState } from 'react';
import type { Application } from '../types';
import { isDuplicateApplication } from '../utils/applicationHelpers';

interface PendingDelete {
  application: Application;
  index: number;
  expiresAt: number;
}

type SetApplications = (
  value:
    | Application[]
    | ((previous: Application[]) => Application[])
) => void;

export function useUndoDelete(
  applications: Application[],
  setApplications: SetApplications,
) {
  const [pendingDelete, setPendingDelete] =
    useState<PendingDelete | null>(null);

  const [undoError, setUndoError] = useState('');

  const pendingRef = useRef<PendingDelete | null>(null);

  const timeoutRef = useRef<
    ReturnType<typeof window.setTimeout> | null
  >(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function clearPending() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = null;
    pendingRef.current = null;

    setPendingDelete(null);
    setUndoError('');
  }

  function deleteApplication(id: string) {
    const index = applications.findIndex(
      (application) => application.id === id,
    );

    if (index < 0) return;

    // Bersihkan timer penghapusan sebelumnya.
    clearPending();

    // Simpan seluruh data, termasuk checklist dan activity log.
    const snapshot: PendingDelete = {
      application: structuredClone(applications[index]),
      index,
      expiresAt: Date.now() + 5000,
    };

    pendingRef.current = snapshot;
    setPendingDelete(snapshot);

    setApplications((previous) =>
      previous.filter((application) => application.id !== id),
    );

    timeoutRef.current = window.setTimeout(() => {
      if (pendingRef.current === snapshot) {
        clearPending();
      }
    }, 5000);
  }

  function undoDelete() {
    const snapshot = pendingRef.current;

    if (!snapshot) return;

    if (Date.now() >= snapshot.expiresAt) {
      clearPending();
      return;
    }

    const duplicate = isDuplicateApplication(
      applications,
      snapshot.application.company,
      snapshot.application.role,
    );

    if (duplicate) {
      setUndoError(
        'Undo ditolak: perusahaan dan posisi yang sama sudah ditambahkan kembali.',
      );
      return;
    }

    setApplications((previous) => {
      const alreadyExists = isDuplicateApplication(
        previous,
        snapshot.application.company,
        snapshot.application.role,
      );

      if (alreadyExists) return previous;

      const index = Math.min(snapshot.index, previous.length);

      return [
        ...previous.slice(0, index),
        snapshot.application,
        ...previous.slice(index),
      ];
    });

    clearPending();
  }

  return {
    pendingDelete,
    undoError,
    deleteApplication,
    undoDelete,
  };
}