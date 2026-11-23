import { useState, useEffect, useMemo } from 'react';
import type { Application, JobListing } from '../types';
import { fetchJobListings, type DataSource } from '../services/jobService';
import { useDebounce } from '../hooks/useDebounce';
import {
  calculateSkillMatch,
  isDuplicateApplication,
} from '../utils/applicationHelpers';

interface JobCatalogProps {
  kaptenSkills: string[];
  applications: Application[];
  onSaveToWishlist: (job: JobListing) => void;
}

export function JobCatalog({
  kaptenSkills,
  applications,
  onSaveToWishlist,
}: JobCatalogProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('remotive');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const debouncedKeyword = useDebounce(searchKeyword, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortByMatch, setSortByMatch] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchJobListings(dataSource, controller.signal)
      .then((data) => {
        setJobs(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Gagal memuat daftar lowongan.';
        setError(message);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [dataSource, retryTrigger]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(jobs.map((job) => job.category)));
    return ['ALL', ...uniqueCats];
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    const keyword = debouncedKeyword.trim().toLowerCase();

    const withMatch = jobs
      .filter((job) => {
        const matchesCategory =
          selectedCategory === 'ALL' || job.category === selectedCategory;
        const matchesKeyword =
          keyword === '' ||
          job.title.toLowerCase().includes(keyword) ||
          job.company_name.toLowerCase().includes(keyword) ||
          job.tags.some((tag) => tag.toLowerCase().includes(keyword));
        return matchesCategory && matchesKeyword;
      })
      .map((job) => ({
        job,
        match: calculateSkillMatch(kaptenSkills, job.tags),
      }));

    if (sortByMatch) {
      withMatch.sort((a, b) => b.match.score - a.match.score);
    }

    return withMatch;
  }, [jobs, debouncedKeyword, selectedCategory, sortByMatch, kaptenSkills]);

  const getScoreBadgeClass = (score: number): string => {
    if (score >= 70) return 'badge-score badge-high';
    if (score >= 40) return 'badge-score badge-mid';
    return 'badge-score badge-low';
  };

  return (
    <section className="catalog-section">
      {/* Toolbar Kontrol Katalog */}
      <div className="panel-box catalog-toolbar">
        <div className="toolbar-top">
          <input
            type="search"
            className="text-input search-bar"
            placeholder="Cari posisi, perusahaan, atau tech stack..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />

          <div className="toolbar-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={sortByMatch}
                onChange={(e) => setSortByMatch(e.target.checked)}
              />
              Urutkan Match Tertinggi
            </label>

            <div className="source-switcher">
              <button
                type="button"
                className={`btn btn-sm ${
                  dataSource === 'remotive' ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => {
                  setSelectedCategory('ALL');
                  setDataSource('remotive');
                }}
              >
                Live Remotive API
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  dataSource === 'fallback' ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => {
                  setSelectedCategory('ALL');
                  setDataSource('fallback');
                }}
              >
                Fallback Lokal (ID)
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills ala Catalog Store */}
        {!isLoading && !error && categories.length > 1 && (
          <div className="category-pills">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`pill-btn ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'ALL' ? 'Semua Kategori' : category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* State 1: Loading */}
      {isLoading && (
        <div className="state-box">
          <div className="spinner" />
          <p>Memuat katalog lowongan magang...</p>
        </div>
      )}

      {/* State 2: Error + Retry / Fallback Lokal */}
      {!isLoading && error && (
        <div className="state-box state-error">
          <h3>Gagal Mengambil Data Lowongan</h3>
          <p>{error}</p>
          <div className="state-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRetryTrigger((prev) => prev + 1)}
            >
              Coba Lagi
            </button>
            {dataSource === 'remotive' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setDataSource('fallback');
                }}
              >
                Gunakan Fallback Lokal
              </button>
            )}
          </div>
        </div>
      )}

      {/* State 3: Empty */}
      {!isLoading && !error && filteredAndSortedJobs.length === 0 && (
        <div className="state-box">
          <h3>Lowongan Tidak Ditemukan</h3>
          <p className="muted-text">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
        </div>
      )}

      {/* State 4: Product/Job Catalog Grid */}
      {!isLoading && !error && filteredAndSortedJobs.length > 0 && (
        <div className="catalog-grid">
          {filteredAndSortedJobs.map(({ job, match }) => {
            const alreadyApplied = isDuplicateApplication(
              applications,
              job.company_name,
              job.title
            );

            return (
              <article key={job.id} className="catalog-card">
                <div className="card-header">
                  <span className="category-badge">{job.category}</span>
                  <span className={getScoreBadgeClass(match.score)}>
                    Match {match.score}%
                  </span>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{job.title}</h3>
                  <p className="card-company">{job.company_name}</p>
                  <p className="card-meta">
                    {job.candidate_required_location} • <strong>{job.salary}</strong>
                  </p>

                  <div className="tags-group">
                    <span className="tags-label">Skill Cocok:</span>
                    <div className="tag-list">
                      {match.matchedSkills.length > 0 ? (
                        match.matchedSkills.map((skill) => (
                          <span key={skill} className="tag tag-matched">
                            ✓ {skill}
                          </span>
                        ))
                      ) : (
                        <span className="muted-text-sm">Belum ada yang cocok</span>
                      )}
                    </div>
                  </div>

                  <div className="tags-group">
                    <span className="tags-label">Missing Skills:</span>
                    <div className="tag-list">
                      {match.missingSkills.length > 0 ? (
                        match.missingSkills.map((skill) => (
                          <span key={skill} className="tag tag-missing">
                            ! {skill}
                          </span>
                        ))
                      ) : (
                        <span className="muted-text-sm">Semua skill terpenuhi</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    type="button"
                    className={`btn btn-full ${
                      alreadyApplied ? 'btn-disabled' : 'btn-primary'
                    }`}
                    disabled={alreadyApplied}
                    onClick={() => onSaveToWishlist(job)}
                  >
                    {alreadyApplied ? 'Sudah Dilamar' : '+ Simpan ke Wishlist'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}