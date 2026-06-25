/**
 * Double-dummy worker — solves one deal per message. A pool of these runs in
 * parallel (see ddPool.ts). The worker is created lazily, so importing the
 * ~525 KB DDS WASM statically still costs nothing until DD is actually used.
 */

import { loadDds, Dds } from 'bridge-dds';
import { solveDeal } from '../engine/ddSolve';
import type { DDSolveOne, DDWorkerMessage } from './dd.protocol';

let ddsPromise: Promise<Dds> | null = null;

function getDds(): Promise<Dds> {
  if (!ddsPromise) ddsPromise = loadDds().then((module) => new Dds(module));
  return ddsPromise;
}

const post = (msg: DDWorkerMessage): void => self.postMessage(msg);

self.onmessage = async (e: MessageEvent<DDSolveOne>): Promise<void> => {
  const msg = e.data;
  if (msg.type !== 'solve') return;
  try {
    const dds = await getDds();
    post({ type: 'result', jobId: msg.jobId, index: msg.index, tricks: solveDeal(dds, msg.pbn, msg.cells) });
  } catch (err) {
    post({ type: 'error', jobId: msg.jobId, index: msg.index, message: err instanceof Error ? err.message : String(err) });
  }
};
