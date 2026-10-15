import type { Address } from '@proton/shared/lib/interfaces/Address';

export type ReconnectBYOEAddressFailure =
    { type: 'no-access' } | { type: 'wrong-account' } | { type: 'sync-failed' } | { type: 'unknown'; message?: string };

export type ReconnectBYOEAddressResult =
    { status: 'success'; address: Address } | { status: 'failure'; reason: ReconnectBYOEAddressFailure };
