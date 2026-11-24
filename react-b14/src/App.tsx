import { useState } from 'react';
import type { Application, JobListing } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  inferWorkMode,
  isDuplicateApplication,
} from './utils/applicationHelpers';
import { SkillProfileBar } from './components/SkillProfileBar';
import { JobCatalog } from './components/JobCatalog';
import { ManualApplicationForm } from './components/ManualApplicationForm';
import {
  shiftLastUpdated,
  type ApplicationUpdater,
} from './utils/warRoomHelpers';
import { WarRoom } from './components/WarRoom';
import { useUndoDelete } from './hooks/useUndoDelete';
import { UndoDeleteToast } from './components/UndoDeleteToast';
import { DashboardStats } from './components/DashboardStats';
import { OfferComparator } from './components/OfferComparator';

import './App.css';
import logo from './assets/logo.png';

type ActiveTab = 'catalog' | 'manual' | 'warroom' | 'comparator';

const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS'];

export function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    'kapten_skills',
    DEFAULT_SKILLS
  );

  const [applications, setApplications] = useLocalStorage<Application[]>(
    'kapten_applications',
    []
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  // Menghubungkan Undo dengan state applications yang sudah ada.
  const {
    pendingDelete,
    undoError,
    deleteApplication,
    undoDelete,
  } = useUndoDelete(applications, setApplications);

  const handleAddSkill = (newSkill: string): boolean => {
    const exists = kaptenSkills.some(
      (s) => s.trim().toLowerCase() === newSkill.trim().toLowerCase()
    );

    if (exists) return false;

    setKaptenSkills((prev) => [...prev, newSkill.trim()]);
    return true;
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setKaptenSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveJobToWishlist = (job: JobListing) => {
    if (isDuplicateApplication(applications, job.company_name, job.title)) {
      return;
    }

    const nowIso = new Date().toISOString();

    const newApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
      lastUpdatedAt: nowIso,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowIso,
          message: 'Disimpan dari Eksplorasi Lowongan ke WISHLIST.',
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const handleAddManualApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const handleUpdateApplication = (
    id: string,
    updater: ApplicationUpdater
  ) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? updater(app) : app))
    );
  };

  const handleSimulateDays = (days: number) => {
  setApplications((prev) =>
    prev.map((app) => {
      const canSimulate =
        app.status === 'APPLIED' ||
        app.status === 'SCREENING';

      return canSimulate
        ? shiftLastUpdated(app, days)
        : app;
    })
  );
};

  return (
    <div className="app-shell">
      {/* Sticky Header ala Catalog Store */}
      <header className="sticky-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src={logo}
              alt="Logo Aku Mw Magang"
              className="brand-logo-img"
            />

            <div>
              <h1>Aku Mw Magang</h1>
              <span className="brand-sub">
                Internship Catalog & Tracker
              </span>
            </div>
          </div>

          <nav className="main-nav">
            <button
              type="button"
              className={`nav-btn ${
                activeTab === 'catalog' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('catalog')}
            >
              Eksplorasi Lowongan
            </button>

            <button
              type="button"
              className={`nav-btn ${
                activeTab === 'manual' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('manual')}
            >
              + Input Manual
            </button>

            <button
              type="button"
              className={`nav-btn ${
                activeTab === 'warroom' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('warroom')}
            >
              War Room ({applications.length})
            </button>

            <button
              type="button"
              className={`nav-btn ${
                activeTab === 'comparator' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('comparator')}
            >
              Offer Comparator
            </button>
          </nav>
        </div>
      </header>

      <main className="main-container">
        <SkillProfileBar
          skills={kaptenSkills}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
        />

        {/* Lima kartu statistik */}
        <DashboardStats applications={applications} />

        {activeTab === 'catalog' && (
          <JobCatalog
            kaptenSkills={kaptenSkills}
            applications={applications}
            onSaveToWishlist={handleSaveJobToWishlist}
          />
        )}

        {activeTab === 'manual' && (
          <ManualApplicationForm
            applications={applications}
            onAddApplication={handleAddManualApplication}
          />
        )}

        {activeTab === 'warroom' && (
          <WarRoom
            applications={applications}
            kaptenSkills={kaptenSkills}
            onUpdateApplication={handleUpdateApplication}
            onSimulateDays={handleSimulateDays}
            onDeleteApplication={deleteApplication}
          />
        )}

        {activeTab === 'comparator' && (
          <OfferComparator
            applications={applications}
            kaptenSkills={kaptenSkills}
          />
        )}
      </main>

      {/* Toast berada di App agar tetap tampil saat pindah tab */}
      {pendingDelete && (
        <UndoDeleteToast
          company={pendingDelete.application.company}
          role={pendingDelete.application.role}
          error={undoError}
          onUndo={undoDelete}
        />
      )}
    </div>
  );
}

export default App;