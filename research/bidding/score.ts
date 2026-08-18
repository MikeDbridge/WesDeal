/**
 * Duplicate bridge scoring + IMPs — enough to recreate Richard Pavlicek's
 * "Opening Bid Comparisons" (rpbridge.net/9x00) from our two-table data. Some
 * sources (BBO LIN) give only contract + tricks, so we compute the raw score
 * ourselves and IMP the difference between the two tables. Validated against the
 * `score_declarer` column of the events that do carry scores.
 */

/** Strain index: 0=♠ 1=♥ 2=♦ 3=♣ 4=NT. */
export function rawScore(
  level: number,
  strain: number,
  doubled: number, // 0 none, 1 doubled, 2 redoubled
  tricks: number,
  declVul: boolean,
): number {
  const target = level + 6;
  const mult = doubled === 2 ? 4 : doubled === 1 ? 2 : 1;
  const perTrick = strain === 4 || strain <= 1 ? 30 : 20; // NT / major 30, minor 20
  if (tricks >= target) {
    const contractPts = ((strain === 4 ? 10 : 0) + level * perTrick) * mult;
    let bonus = contractPts >= 100 ? (declVul ? 500 : 300) : 50; // game / part-score
    if (level === 6) bonus += declVul ? 750 : 500; // small slam
    if (level === 7) bonus += declVul ? 1500 : 1000; // grand slam
    if (doubled === 1) bonus += 50; // insult
    if (doubled === 2) bonus += 100;
    const over = tricks - target;
    const otPts =
      doubled === 0 ? over * perTrick : over * (declVul ? 200 : 100) * (doubled === 2 ? 2 : 1);
    return contractPts + bonus + otPts;
  }
  const under = target - tricks;
  if (doubled === 0) return -(under * (declVul ? 100 : 50));
  let pen: number;
  if (declVul) pen = 200 + (under - 1) * 300;
  else {
    pen = 100;
    for (let i = 2; i <= under; i++) pen += i <= 3 ? 200 : 300;
  }
  return -(pen * (doubled === 2 ? 2 : 1));
}

/** Whether the declaring side is vulnerable, from the board vul + declarer seat. */
export function declarerVul(vul: string, declarer: string): boolean {
  const ns = declarer === 'N' || declarer === 'S';
  if (vul === 'All' || vul === 'Both') return true;
  if (vul === 'N-S') return ns;
  if (vul === 'E-W') return !ns;
  return false;
}

/** Raw score from North–South's perspective (+ good for NS). */
export function nsScore(
  level: number,
  strain: number,
  doubled: number,
  tricks: number,
  vul: string,
  declarer: string,
): number {
  const s = rawScore(level, strain, doubled, tricks, declarerVul(vul, declarer));
  return declarer === 'N' || declarer === 'S' ? s : -s;
}

// Lower bound (points) of each IMP step, 1..24.
const IMP_STEPS = [
  20, 50, 90, 130, 170, 220, 270, 320, 370, 430, 500, 600, 750, 900, 1100, 1300,
  1500, 1750, 2000, 2250, 2500, 3000, 3500, 4000,
];

/** Convert a point difference (NS view) to signed IMPs. */
export function toImps(pointDiff: number): number {
  const a = Math.abs(pointDiff);
  let i = 0;
  while (i < IMP_STEPS.length && a >= IMP_STEPS[i]) i++;
  return pointDiff < 0 ? -i : i;
}
