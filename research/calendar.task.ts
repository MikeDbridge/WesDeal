/**
 * Build the DB calendar: scan the whole scrape (_all/contracts.csv) and emit one
 * record per tournament — year, region, display name, stages, and how many of
 * its contracts carry an auction (so the UI can flag "bidding data" vs
 * "final results only"). Unlike the bidding study this counts EVERY row, not
 * just auction-bearing ones, so results-only events still appear.
 *
 * Output: research/calendar-data.json  (rendered by src/calendar.ts → WesCal).
 * Run: npm run research:calendar
 */

import { it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SCRAPE_DIR = path.join(
  import.meta.dirname,
  '..',
  'Bridge - World Championship data scrape',
  'data',
  '_all',
);
const OUT = path.join(import.meta.dirname, 'calendar-data.json');

/** Per-tournament metadata not derivable from the data. */
interface Meta {
  name: string;
  region: 'World' | 'Europe' | 'USA';
  kind: string; // Team championship / Transnational / Trials / NABC KO
}
const META: Record<string, Meta> = {
  lyon17: { name: 'World Team Champs (Lyon)', region: 'World', kind: 'Team championship' },
  wuhan19: { name: 'World Team Champs (Wuhan)', region: 'World', kind: 'Team championship' },
  salso22: { name: 'World Team Champs (Salsomaggiore)', region: 'World', kind: 'Team championship' },
  marrakech23: { name: 'World Team Champs (Marrakech)', region: 'World', kind: 'Team championship' },
  herning25: { name: 'World Team Champs (Herning)', region: 'World', kind: 'Team championship' },
  marrakech23tn: { name: 'World Transnational Open (Marrakech)', region: 'World', kind: 'Transnational' },
  herning25tn: { name: 'World Transnational Open (Herning)', region: 'World', kind: 'Transnational' },
  ostend18: { name: 'European Team Champs (Ostend)', region: 'Europe', kind: 'Team championship' },
  madeira22: { name: 'European Team Champs (Madeira)', region: 'Europe', kind: 'Team championship' },
  euchamp24: { name: 'European Team Champs (Herning)', region: 'Europe', kind: 'Team championship' },
  riga26: { name: 'European Team Champs (Riga)', region: 'Europe', kind: 'Team championship' },
  strasbourg23: { name: 'European Transnational Open (Strasbourg)', region: 'Europe', kind: 'Transnational' },
  prague26: { name: 'European Transnational Open (Prague)', region: 'Europe', kind: 'Transnational' },
  usbc26: { name: 'US Bridge Championship (trials)', region: 'USA', kind: 'Trials' },
  vanderbilt25: { name: 'Vanderbilt Cup', region: 'USA', kind: 'NABC knockout' },
  spingold25: { name: 'Spingold Trophy', region: 'USA', kind: 'NABC knockout' },
  soloway25: { name: 'Soloway Knockout', region: 'USA', kind: 'NABC knockout' },
};

/** Year from the trailing 2 digits of a tournament key ("herning25" → 2025). */
function yearOf(key: string): number {
  const m = key.match(/(\d{2})(?:tn)?$/);
  if (!m) return 0;
  const yy = Number(m[1]);
  return yy >= 90 ? 1900 + yy : 2000 + yy;
}

interface Row {
  key: string;
  name: string;
  region: string;
  kind: string;
  year: number;
  contracts: number;
  auctions: number;
  hasBidding: boolean;
  /** stage → { contracts, auctions } */
  stages: Record<string, { c: number; a: number }>;
}

it('build DB calendar data', () => {
  if (!existsSync(path.join(SCRAPE_DIR, 'contracts.csv'))) {
    throw new Error(`missing ${SCRAPE_DIR}/contracts.csv — scrape + flatten + rebuild _all first`);
  }
  const text = readFileSync(path.join(SCRAPE_DIR, 'contracts.csv'), 'utf8');
  const lines = text.split('\n');
  const header = lines[0].split(',');
  const iTourn = header.indexOf('tournament');
  const iStage = header.indexOf('stage');
  const iAuction = header.indexOf('auction');

  const rows = new Map<string, Row>();
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (line.trim() === '') continue;
    // Fast field split — tournament/stage are simple tokens; auction may contain
    // spaces but never a comma, so a plain comma split is safe for these columns.
    const f = line.split(',');
    const key = f[iTourn];
    if (!key) continue;
    let row = rows.get(key);
    if (!row) {
      const meta = META[key] ?? { name: key, region: 'World' as const, kind: 'Other' };
      row = {
        key,
        name: meta.name,
        region: meta.region,
        kind: meta.kind,
        year: yearOf(key),
        contracts: 0,
        auctions: 0,
        hasBidding: false,
        stages: {},
      };
      rows.set(key, row);
    }
    const stage = f[iStage] || '?';
    const hasAuction = (f[iAuction] ?? '') !== '';
    row.contracts++;
    if (hasAuction) row.auctions++;
    const st = (row.stages[stage] ??= { c: 0, a: 0 });
    st.c++;
    if (hasAuction) st.a++;
  }
  for (const row of rows.values()) row.hasBidding = row.auctions > 0;

  const out = [...rows.values()].sort(
    (a, b) => a.year - b.year || a.region.localeCompare(b.region) || a.name.localeCompare(b.name),
  );
  const totalAuctions = out.reduce((n, r) => n + r.auctions, 0);
  writeFileSync(
    OUT,
    JSON.stringify(
      { generated: new Date().toISOString().slice(0, 10), totalContracts: out.reduce((n, r) => n + r.contracts, 0), totalAuctions, tournaments: out },
      null,
      1,
    ) + '\n',
  );
  console.log(`${out.length} tournaments, ${totalAuctions} auctions → ${OUT}`);
});
