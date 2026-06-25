/**
 * A pool of double-dummy workers (one per CPU core, capped). Deals are handed
 * out dynamically — each worker pulls the next deal when it finishes, so the
 * load stays balanced even though some deals take longer to solve than others.
 */

import type { DDCell } from '../engine/dd';
import type { DDSolveOne, DDWorkerMessage } from './dd.protocol';

export interface DDPoolHandlers {
  onResult(index: number, tricks: number[]): void;
  onProgress(done: number, total: number): void;
  onDone(): void;
  onError(message: string): void;
}

export class DDPool {
  private readonly size: number;
  private readonly workers: Worker[] = [];
  private readonly busy = new Set<Worker>();

  private jobId = 0;
  private queue: number[] = [];
  private deals: string[] = [];
  private cells: DDCell[] = [];
  private done = 0;
  private total = 0;
  private handlers: DDPoolHandlers | null = null;

  constructor(size?: number) {
    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    this.size = Math.max(1, Math.min(size ?? cores, 8));
  }

  /** Start (or restart) a solve. A new call supersedes any in-flight run. */
  solve(deals: string[], cells: DDCell[], handlers: DDPoolHandlers): void {
    this.jobId++;
    this.deals = deals;
    this.cells = cells;
    this.handlers = handlers;
    this.queue = deals.map((_, i) => i);
    this.done = 0;
    this.total = deals.length;

    if (this.total === 0) {
      handlers.onDone();
      return;
    }
    const want = Math.min(this.size, this.total);
    while (this.workers.length < want) this.workers.push(this.spawn());
    // Kick the idle workers; busy ones pick up the new job when they report back.
    for (const w of this.workers) if (!this.busy.has(w)) this.dispatch(w);
  }

  private spawn(): Worker {
    const w = new Worker(new URL('./dd.worker.ts', import.meta.url), { type: 'module' });
    w.addEventListener('message', (e: MessageEvent<DDWorkerMessage>) => this.onMessage(w, e.data));
    w.addEventListener('error', (e) => this.handlers?.onError(e.message));
    return w;
  }

  private dispatch(w: Worker): void {
    const index = this.queue.shift();
    if (index === undefined) {
      this.busy.delete(w);
      return;
    }
    this.busy.add(w);
    const msg: DDSolveOne = { type: 'solve', jobId: this.jobId, index, pbn: this.deals[index], cells: this.cells };
    w.postMessage(msg);
  }

  private onMessage(w: Worker, msg: DDWorkerMessage): void {
    // Ignore replies from a superseded job, but still reuse the freed worker.
    if (msg.jobId === this.jobId) {
      if (msg.type === 'result') this.handlers?.onResult(msg.index, msg.tricks);
      else this.handlers?.onError(msg.message);
      this.done++;
      this.handlers?.onProgress(this.done, this.total);
      if (this.done >= this.total) this.handlers?.onDone();
    }
    this.dispatch(w);
  }
}
