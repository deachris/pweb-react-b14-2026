import { useState, type FormEvent } from 'react';

interface SkillProfileBarProps {
  skills: string[];
  onAddSkill: (newSkill: string) => boolean;
  onRemoveSkill: (skillToRemove: string) => void;
}

export function SkillProfileBar({
  skills,
  onAddSkill,
  onRemoveSkill,
}: SkillProfileBarProps) {
  const [skillInput, setSkillInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) {
      setErrorMsg('Nama skill tidak boleh kosong.');
      return;
    }

    const added = onAddSkill(trimmed);
    if (!added) {
      setErrorMsg(`Skill "${trimmed}" sudah ada di profil Kapten.`);
      return;
    }

    setSkillInput('');
    setErrorMsg('');
  };

  return (
    <section className="panel-box skill-profile-section">
      <div className="skill-header">
        <div>
          <h2>Profil Skill Kapten</h2>
          <p className="muted-text">
            Skill ini otomatis menghitung Match Score % pada setiap kartu lowongan.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="skill-form">
          <input
            type="text"
            className="text-input"
            placeholder="Tambah skill (misal: Docker, SQL)..."
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
          />
          <button type="submit" className="btn btn-primary">
            + Tambah Skill
          </button>
        </form>
      </div>

      {errorMsg && <p className="error-inline">{errorMsg}</p>}

      <div className="skill-chip-list">
        {skills.map((skill) => (
          <span key={skill} className="skill-chip">
            {skill}
            <button
              type="button"
              className="chip-remove-btn"
              onClick={() => onRemoveSkill(skill)}
              aria-label={`Hapus ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}