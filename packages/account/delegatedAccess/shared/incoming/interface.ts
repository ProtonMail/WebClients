import type { getEnrichedIncomingDelegatedAccess, getMetaIncomingDelegatedAccess } from './helper';

export type MetaIncomingDelegatedAccess = ReturnType<typeof getMetaIncomingDelegatedAccess>;
export type EnrichedIncomingDelegatedAccess = ReturnType<typeof getEnrichedIncomingDelegatedAccess>;

export interface DeleteActionPayload {
    type: 'delete-emergency-contact' | 'delete-recovery-contact';
    value: EnrichedIncomingDelegatedAccess;
}

export interface RequestAccessActionPayload {
    type: 'request-access';
    value: EnrichedIncomingDelegatedAccess;
}

export interface CancelRequestAccessActionPayload {
    type: 'cancel-request-access';
    value: EnrichedIncomingDelegatedAccess;
}

export interface AccessActionPayload {
    type: 'access';
    value: EnrichedIncomingDelegatedAccess;
}

export interface RecoverActionPayload {
    type: 'recover';
    value: EnrichedIncomingDelegatedAccess;
}

export type ActionPayload =
    | RequestAccessActionPayload
    | CancelRequestAccessActionPayload
    | DeleteActionPayload
    | AccessActionPayload
    | RecoverActionPayload;
export type ActionListener = (payload: ActionPayload) => undefined;
