import type { ReactNode } from 'react';

import type { FilterStatement } from '@proton/sieve/filterModel';

import type { Condition } from '../filters/interfaces';

export enum ForwardModalStep {
    Setup,
    UserConfirmation,
    FixupPrimaryKeys,
    FinalizeForwardingSetup,
    SuccessNotification,
}

export interface ForwardModalState {
    step: ForwardModalStep;
    loading?: boolean;
    addressID: string;
    isExternal?: boolean;
    isInternal?: boolean;
    forwardeeEmail: string;
    statement: FilterStatement;
    conditions: Condition[];
    encryptionFixupDetails?: { setup: ReactNode; success: ReactNode } | null;
}
