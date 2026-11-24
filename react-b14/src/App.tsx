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

  const handleSimulateDays = (days: number) => {
    setApplications((prev) => prev.map((app) => shiftLastUpdated(app, days)));
  };

  return (
    <div className="app-shell">
      {/* Sticky Header ala Catalog Store */}
      <header className="sticky-header">
        <div className="header-inner">
          <div className="brand">
            <img src={logo} alt="Logo Aku Mw Magang" className="brand-logo-img" />
            <div>
              <h1>Aku Mw Magang</h1>
              <span className="brand-sub">Internship Catalog & Tracker</span>
            </div>
          </div>

          <nav className="main-nav">
            <button
              type="button"
              className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              Eksplorasi Lowongan
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              + Input Manual
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'warroom' ? 'active' : ''}`}
              onClick={() => setActiveTab('warroom')}
            >
              War Room ({applications.length})
            </button>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'comparator' ? 'active' : ''}`}
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
          <div className="state-box">
            <h3>Slot Fitur 3–6 (Anggota 2 & 3)</h3>
            <p className="muted-text">
              Total lamaran tersimpan di localStorage saat ini:{' '}
              <strong>{applications.length}</strong>
            </p>
          </div>
        )}

        {activeTab === 'comparator' && (
          <div className="state-box">
            <h3>Slot Fitur 7 (Anggota 3)</h3>
            <p className="muted-text">
              Dashboard Statistik & Offer Comparator akan dipasang di tab ini.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;