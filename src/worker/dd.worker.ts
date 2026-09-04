/**
 * Double-dummy worker — one deal per message. A pool of these runs in parallel
 * (see ddPool.ts) and the WesPlay analyser drives one directly (ddClient.ts).
 * The worker is created lazily, so importing the ~525 KB DDS WASM statically
 * still costs nothing until DD is actually used.
 *
 * Four jobs: 'solve' scores the requested strain × declarer cells; 'leads'
 * scores every legal opening lead; 'play' scores every legal card of a
 * mid-play position (SolveBoardPBN, target −1, solutions 3, equivalents
 * expanded to actual cards); 'table' computes the full makeable-contracts
 * table plus the par score (CalcDDTablePBN + DealerPar).
 */

import { loadDds, Dds } from 'bridge-dds';
import { solveDeal } from '../engine/ddSolve';
import { expandFutureTricks } from '../engine/lead';
import type { DDWorkerRequest, DDWorkerMessage } from './dd.protocol';

let ddsPromise: Promise<Dds> | null = null;

function getDds(): Promise<Dds> {
  if (!ddsPromise) ddsPromise = loadDds().then((module) => new Dds(module));
  return ddsPromise;
}

const post = (msg: DDWorkerMessage): void => self.postMessage(msg);

self.onmessage = async (e: MessageEvent<DDWorkerRequest>): Promise<void> => {
  const msg = e.data;
  try {
    const dds = await getDds();
    if (msg.type === 'solve') {
      post({ type: 'result', jobId: msg.jobId, index: msg.index, tricks: solveDeal(dds, msg.pbn, msg.cells) });
    } else if (msg.type === 'leads') {
      const ft = dds.SolveBoardPBN(
        {
          trump: msg.trump,
          first: msg.leader,
          currentTrickSuit: [0, 0, 0],
          currentTrickRank: [0, 0, 0],
          remainCards: msg.pbn,
        },
        -1, // target: find the maximum
        3, // solutions: score every legal card
        1, // mode
      );
      post({ type: 'leads-result', jobId: msg.jobId, index: msg.index, cards: expandFutureTricks(ft) });
    } else if (msg.type === 'play') {
      const ft = dds.SolveBoardPBN(msg.position, -1, 3, 1);
      post({ type: 'play-result', jobId: msg.jobId, index: msg.index, cards: expandFutureTricks(ft) });
    } else if (msg.type === 'table') {
      const table = dds.CalcDDTablePBN({ cards: msg.pbn });
      const par = dds.DealerPar(table, msg.dealer, msg.vul);
      post({
        type: 'table-result',
        jobId: msg.jobId,
        index: msg.index,
        table: table.resTable,
        parScore: par.score,
        parContracts: par.contracts,
      });
    }
  } catch (err) {
    post({
      type: 'error',
      jobId: msg.jobId,
      index: msg.index,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
