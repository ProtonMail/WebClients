import type { ReactNode } from 'react';

import type { Condition, FilterStatement } from '@proton/components/containers/filters/interfaces';
import type { PublicKeyReference } from '@proton/crypto';

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

export interface ForwardModalKeyState {
    forwardeePublicKey: PublicKeyReference | undefined;
    forwarderPrimaryKeysInfo: {
        v4: { ID: string; supportsE2EEForwarding: boolean };
        v6?: { ID: string; supportsE2EEForwarding: false };
    };
}
