/**
 * Double-dummy worker. The worker itself is created lazily (only on the first
 * solve), so importing the ~525 KB DDS WASM statically here still costs nothing
 * until DD is actually used. It streams a trick result back for each deal.
 */

import { loadDds, Dds } from 'bridge-dds';
import { solveDeal } from '../engine/ddSolve';
import type { DDSolveRequest, DDWorkerMessage } from './dd.protocol';

let ddsPromise: Promise<Dds> | null = null;

function getDds(): Promise<Dds> {
  if (!ddsPromise) ddsPromise = loadDds().then((module) => new Dds(module));
  return ddsPromise;
}

const post = (msg: DDWorkerMessage): void => self.postMessage(msg);

self.onmessage = async (e: MessageEvent<DDSolveRequest>): Promise<void> => {
  const msg = e.data;
  if (msg.type !== 'solve') return;
  try {
    const dds = await getDds();
    post({ type: 'ready' });
    for (let i = 0; i < msg.deals.length; i++) {
      post({ type: 'result', index: i, tricks: solveDeal(dds, msg.deals[i], msg.cells) });
    }
    post({ type: 'done' });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
