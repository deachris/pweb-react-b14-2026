import type { JobListing } from '../types';

export type DataSource = 'remotive' | 'fallback';

interface RemotiveApiResponse {
  jobs?: JobListing[];
}

const REMOTIVE_URL =
  'https://remotive.com/api/remote-jobs?category=software-dev&limit=30';
const FALLBACK_URL = '/magang-fallback.json';

export async function fetchJobListings(
  source: DataSource,
  signal?: AbortSignal
): Promise<JobListing[]> {
  const url = source === 'remotive' ? REMOTIVE_URL : FALLBACK_URL;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: Gagal memuat data lowongan`);
  }

  const rawData: unknown = await response.json();

  const rawJobs: JobListing[] = Array.isArray(rawData)
    ? (rawData as JobListing[])
    : Array.isArray((rawData as RemotiveApiResponse).jobs)
    ? ((rawData as RemotiveApiResponse).jobs ?? [])
    : [];

  return rawJobs.map((job) => ({
    id: job.id,
    title: job.title ?? 'Untitled Role',
    company_name: job.company_name ?? 'Unknown Company',
    category: job.category ?? 'Software Development',
    candidate_required_location: job.candidate_required_location ?? 'Remote',
    salary: job.salary && job.salary.trim() !== '' ? job.salary : 'Kompetitif',
    tags: Array.isArray(job.tags) ? job.tags : [],
  }));
}