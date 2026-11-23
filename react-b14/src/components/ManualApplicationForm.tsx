import { useState, useRef, type FormEvent } from 'react';
import type { Application, WorkMode } from '../types';
import { isDuplicateApplication } from '../utils/applicationHelpers';

interface ManualApplicationFormProps {
  applications: Application[];
  onAddApplication: (newApp: Application) => void;
}

type InitialStatus = 'WISHLIST' | 'APPLIED';

export function ManualApplicationForm({
  applications,
  onAddApplication,
}: ManualApplicationFormProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Hybrid');
  const [initialStatus, setInitialStatus] = useState<InitialStatus>('WISHLIST');
  const [skillsInput, setSkillsInput] = useState('');
  const [cvVersion, setCvVersion] = useState('');
  const [appliedDate, setAppliedDate] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // useRef untuk auto-focus ke input pertama yang error
  const companyRef = useRef<HTMLInputElement | null>(null);
  const roleRef = useRef<HTMLInputElement | null>(null);
  const skillsRef = useRef<HTMLInputElement | null>(null);
  const cvVersionRef = useRef<HTMLInputElement | null>(null);
  const appliedDateRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (!company.trim()) {
      setFormError('Nama perusahaan wajib diisi.');
      companyRef.current?.focus();
      return;
    }

    if (!role.trim()) {
      setFormError('Posisi / Role wajib diisi.');
      roleRef.current?.focus();
      return;
    }

    if (isDuplicateApplication(applications, company, role)) {
      setFormError(
        `Lamaran untuk posisi "${role.trim()}" di "${company.trim()}" sudah ada (duplikat ditolak).`
      );
      companyRef.current?.focus();
      return;
    }

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedSkills.length === 0) {
      setFormError('Isi minimal 1 required skill (pisahkan dengan koma).');
      skillsRef.current?.focus();
      return;
    }

    if (initialStatus === 'APPLIED') {
      if (!cvVersion.trim()) {
        setFormError('Versi CV wajib diisi jika status awal APPLIED.');
        cvVersionRef.current?.focus();
        return;
      }
      if (!appliedDate) {
        setFormError('Tanggal melamar wajib diisi jika status awal APPLIED.');
        appliedDateRef.current?.focus();
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      workMode,
      status: initialStatus,
      requiredSkills: parsedSkills,
      ...(initialStatus === 'APPLIED'
        ? {
            cvVersion: cvVersion.trim(),
            appliedDate,
          }
        : {}),
      lastUpdatedAt: nowIso,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowIso,
          message: `Lamaran dibuat secara manual dengan status ${initialStatus}.`,
        },
      ],
    };

    onAddApplication(newApplication);

    // Reset form
    setCompany('');
    setRole('');
    setWorkMode('Hybrid');
    setInitialStatus('WISHLIST');
    setSkillsInput('');
    setCvVersion('');
    setAppliedDate('');
    setFormError(null);
    setSuccessMsg(
      `Berhasil menambahkan ${newApplication.role} di ${newApplication.company}!`
    );
  };

  return (
    <section className="panel-box manual-form-section">
      <h2>Tambah Lamaran Manual</h2>
      <p className="muted-text">
        Catat lowongan dari luar katalog agar seluruh proses tetap terpantau.
      </p>

      {formError && <div className="alert-banner alert-error">{formError}</div>}
      {successMsg && (
        <div className="alert-banner alert-success">{successMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="manual-form-grid" noValidate>
        <div className="form-group">
          <label htmlFor="company-input">Perusahaan *</label>
          <input
            ref={companyRef}
            id="company-input"
            type="text"
            className="text-input"
            placeholder="Contoh: GoTo Financial"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="role-input">Posisi / Role *</label>
          <input
            ref={roleRef}
            id="role-input"
            type="text"
            className="text-input"
            placeholder="Contoh: Frontend Engineer Intern"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="workmode-select">Mode Kerja *</label>
          <select
            id="workmode-select"
            className="text-input"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkMode)}
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status-select">Status Awal *</label>
          <select
            id="status-select"
            className="text-input"
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value as InitialStatus)}
          >
            <option value="WISHLIST">WISHLIST</option>
            <option value="APPLIED">APPLIED</option>
          </select>
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="skills-input">
            Required Skills (pisahkan dengan koma) *
          </label>
          <input
            ref={skillsRef}
            id="skills-input"
            type="text"
            className="text-input"
            placeholder="Contoh: React, TypeScript, CSS, Docker"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          />
        </div>

        {initialStatus === 'APPLIED' && (
          <>
            <div className="form-group">
              <label htmlFor="cv-input">Versi CV *</label>
              <input
                ref={cvVersionRef}
                id="cv-input"
                type="text"
                className="text-input"
                placeholder="Contoh: CV_Kapten_FE_v2.pdf"
                value={cvVersion}
                onChange={(e) => setCvVersion(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date-input">Tanggal Melamar *</label>
              <input
                ref={appliedDateRef}
                id="date-input"
                type="date"
                className="text-input"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="form-group-full">
          <button type="submit" className="btn btn-primary">
            Simpan Lamaran
          </button>
        </div>
      </form>
    </section>
  );
}