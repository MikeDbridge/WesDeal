/**
 * Promise-based client for a single double-dummy worker — the WesPlay
 * analyser's interface to DDS. Where the pool (ddPool.ts) fans a batch of
 * deals across cores, the analyser asks one question at a time about one
 * deal ("what does every card score here?", "what's the makeable table?"),
 * so a lone worker with request/response matching by jobId is the right
 * shape. The worker processes messages in order, which is the queue.
 */

import type { LeadCardScore } from '../engine/lead';
import type { DDPlayPosition } from '../engine/play';
import type { DDWorkerRequest, DDWorkerMessage } from './dd.protocol';

export interface DDTableResult {
  /** tricks[strain][declarer], strains ♠♥♦♣NT, declarers N E S W. */
  table: number[][];
  /** Par score from NS's viewpoint. */
  parScore: number;
  /** Par contracts as DDS strings, e.g. "2C-EW", "4Sx-NS". */
  parContracts: string[];
}

interface Pending {
  resolve: (msg: DDWorkerMessage) => void;
  reject: (err: Error) => void;
}

/** A request body before the client stamps ids on it (distributes the union). */
type RequestBody<T> = T extends unknown ? Omit<T, 'jobId' | 'index'> : never;

export class DDClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();

  private ensure(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./dd.worker.ts', import.meta.url), { type: 'module' });
      this.worker.addEventListener('message', (e: MessageEvent<DDWorkerMessage>) => {
        const p = this.pending.get(e.data.jobId);
        if (!p) return;
        this.pending.delete(e.data.jobId);
        if (e.data.type === 'error') p.reject(new Error(e.data.message));
        else p.resolve(e.data);
      });
      this.worker.addEventListener('error', (e) => {
        for (const p of this.pending.values()) p.reject(new Error(e.message || 'DD worker failed'));
        this.pending.clear();
      });
    }
    return this.worker;
  }

  private request(msg: RequestBody<DDWorkerRequest>): Promise<DDWorkerMessage> {
    const jobId = this.nextId++;
    const worker = this.ensure();
    return new Promise((resolve, reject) => {
      this.pending.set(jobId, { resolve, reject });
      worker.postMessage({ ...msg, jobId, index: 0 } as DDWorkerRequest);
    });
  }

  /** Every legal card of a mid-play position, scored (equivalents expanded). */
  async solvePlay(position: DDPlayPosition): Promise<LeadCardScore[]> {
    const msg = await this.request({ type: 'play', position });
    return msg.type === 'play-result' ? msg.cards : [];
  }

  /** Full makeable-contracts table + par for the given dealer/vulnerability. */
  async solveTable(pbn: string, dealer: number, vul: number): Promise<DDTableResult> {
    const msg = await this.request({ type: 'table', pbn, dealer, vul });
    if (msg.type !== 'table-result') throw new Error('Unexpected DD reply');
    return { table: msg.table, parScore: msg.parScore, parContracts: msg.parContracts };
  }
}
