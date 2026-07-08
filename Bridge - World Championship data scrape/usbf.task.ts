import { it } from 'vitest';
import { runUsbf } from './usbf';

// Ingest USBF USBC LoveBridge PBN into ./data/<USBF_TOURN>/. Scope with env:
// USBF_PAGE (bidding-records page URL), USBF_TOURN (key), USBF_EVENTS (default "open").
it('ingest USBF USBC results', () => runUsbf(), 10_800_000);
