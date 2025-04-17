import type { Condition, FilterStatement } from '@proton/components/containers/filters/interfaces';
import type { PublicKeyReference } from '@proton/crypto';

export enum ForwardModalStep {
    Setup,
    UserConfirmation,
    FixupPrimaryKeys,
    FinalizeForwardingSetup,
}

export interface ForwardModalState {
    step: ForwardModalStep;
    loading?: boolean;
    addressID: string;
    isExternal?: boolean;
    isInternal?: boolean;
    forwardeeEmail: string;
    keyErrors?: string[];
    statement: FilterStatement;
    conditions: Condition[];
}

export interface ForwardModalKeyState {
    forwardeePublicKey: PublicKeyReference | undefined;
    forwarderPrimaryKeysInfo: {
        v4: { ID: string; supportsE2EEForwarding: boolean };
        v6?: { ID: string; supportsE2EEForwarding: false };
    };
}
