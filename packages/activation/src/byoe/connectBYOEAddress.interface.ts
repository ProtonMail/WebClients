import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { TIME_PERIOD } from '../interface';

export type ConnectBYOEAddressFailure =
    | { type: 'no-access' }
    | { type: 'already-added' }
    | { type: 'create-failed'; message?: string }
    | { type: 'convert-failed'; message?: string }
    | { type: 'linked-to-another-account' }
    | { type: 'wrong-account' }
    | { type: 'token-failed' }
    | { type: 'claimable-address'; email: string; importEmails: boolean; importPeriod?: TIME_PERIOD }
    | { type: 'unknown'; message?: string };

export type ConnectBYOEAddressResult =
    | { status: 'success'; address: Address; importEmails: boolean }
    | { status: 'failure'; reason: ConnectBYOEAddressFailure };

export type ConnectBYOEAddressFailureResult = Extract<ConnectBYOEAddressResult, { status: 'failure' }>;

export type StartImportTaskResult = ConnectBYOEAddressFailureResult | { status: 'started' };
export type FinalizeAddressResult =
    ConnectBYOEAddressFailureResult | { status: 'finalized'; address: Address | undefined };
