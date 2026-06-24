/**
 * Runs the generate-and-test loop off the main thread so the UI stays
 * responsive even when constraints require many attempts.
 */

import { generateDeals } from '../engine/dealer';
import type { GenerateRequest, WorkerResponse } from './protocol';

function post(message: WorkerResponse): void {
  (self as unknown as { postMessage(m: unknown): void }).postMessage(message);
}

self.addEventListener('message', (event) => {
  const request = event.data as GenerateRequest;
  try {
    post({ type: 'result', result: generateDeals(request) });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
});
