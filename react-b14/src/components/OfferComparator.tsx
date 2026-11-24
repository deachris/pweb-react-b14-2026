import { useState } from 'react';
import type { Application } from '../types';
import { calculateOfferScore } from '../utils/offerAnalytics';
import { formatRupiah } from '../utils/warRoomHelpers';

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

export function OfferComparator({
  applications,
  kaptenSkills,
}: OfferComparatorProps) {
  const [offerAId, setOfferAId] = useState('');
  const [offerBId, setOfferBId] = useState('');

  const offers = applications.filter(
    (application) => application.status === 'OFFER',
  );

  const offerA =
    offers.find((offer) => offer.id === offerAId) ??
    offers[0];

  const offerB =
    offers.find(
      (offer) =>
        offer.id === offerBId &&
        offer.id !== offerA?.id,
    ) ??
    offers.find((offer) => offer.id !== offerA?.id);

  if (!offerA || !offerB) {
    return (
      <section className="offer-dashboard">
        <div className="state-box">
          <h2>Offer Comparator</h2>

          <p>
            Butuh minimal 2 lamaran berstatus OFFER
            untuk membandingkan penawaran.
          </p>

          <p className="muted-text">
            Saat ini tersedia {offers.length} offer.
          </p>
        </div>
      </section>
    );
  }

  const highestSalary = Math.max(
    offerA.salaryOffer ?? 0,
    offerB.salaryOffer ?? 0,
  );

  const scoreA = calculateOfferScore(
    offerA,
    kaptenSkills,
    highestSalary,
  );

  const scoreB = calculateOfferScore(
    offerB,
    kaptenSkills,
    highestSalary,
  );

  const tied =
    Math.abs(scoreA.total - scoreB.total) < 0.000001;

  const recommendation = tied
    ? 'Kedua offer memiliki skor yang sama.'
    : `${
        scoreA.total > scoreB.total
          ? offerA.company
          : offerB.company
      } memperoleh skor tertinggi.`;

  return (
    <section className="offer-dashboard">
      <div className="panel-box offer-comparator">
        <h2>Offer Comparator</h2>

        <div className="offer-offer-selectors">
          <label>
            Offer A

            <select
              className="text-input"
              value={offerA.id}
              onChange={(event) =>
                setOfferAId(event.target.value)
              }
            >
              {offers.map((offer) => (
                <option
                  key={offer.id}
                  value={offer.id}
                  disabled={offer.id === offerB.id}
                >
                  {offer.company} — {offer.role}
                </option>
              ))}
            </select>
          </label>

          <label>
            Offer B

            <select
              className="text-input"
              value={offerB.id}
              onChange={(event) =>
                setOfferBId(event.target.value)
              }
            >
              {offers.map((offer) => (
                <option
                  key={offer.id}
                  value={offer.id}
                  disabled={offer.id === offerA.id}
                >
                  {offer.company} — {offer.role}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="offer-table-wrapper">
          <table className="offer-comparison-table">
            <thead>
              <tr>
                <th>Komponen</th>
                <th>Offer A</th>
                <th>Offer B</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <th>Perusahaan</th>
                <td>{offerA.company}</td>
                <td>{offerB.company}</td>
              </tr>

              <tr>
                <th>Gaji</th>
                <td>{formatRupiah(scoreA.salary)}</td>
                <td>{formatRupiah(scoreB.salary)}</td>
              </tr>

              <tr>
                <th>Normalisasi Gaji</th>
                <td>
                  {scoreA.normalizedSalary.toFixed(2)}
                </td>
                <td>
                  {scoreB.normalizedSalary.toFixed(2)}
                </td>
              </tr>

              <tr>
                <th>Mode Kerja</th>
                <td>
                  {offerA.workMode}
                  {' '}({scoreA.workModeScore})
                </td>
                <td>
                  {offerB.workMode}
                  {' '}({scoreB.workModeScore})
                </td>
              </tr>

              <tr>
                <th>Skill Match</th>
                <td>{scoreA.skillMatch}%</td>
                <td>{scoreB.skillMatch}%</td>
              </tr>

              <tr>
                <th>Total Skor</th>
                <td>
                  <strong>
                    {scoreA.total.toFixed(2)}
                  </strong>
                </td>
                <td>
                  <strong>
                    {scoreB.total.toFixed(2)}
                  </strong>
                </td>
              </tr>

              <tr>
                <th>Rekomendasi</th>

                <td>
                  {(tied || scoreA.total > scoreB.total) && (
                    <span className="offer-recommendation">
                      Rekomendasi Terbaik
                      {tied ? ' (imbang)' : ''}
                    </span>
                  )}
                </td>

                <td>
                  {(tied || scoreB.total > scoreA.total) && (
                    <span className="offer-recommendation">
                      Rekomendasi Terbaik
                      {tied ? ' (imbang)' : ''}
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p role="status">{recommendation}</p>

        <p className="muted-text">
          Skor = Gaji ternormalisasi × 50% +
          Mode Kerja × 25% + Skill Match × 25%.
        </p>

        <p className="muted-text">
          Normalisasi gaji = gaji / gaji tertinggi
          dari dua offer terpilih × 100.
        </p>
      </div>
    </section>
  );
}