import type { getEnrichedIncomingDelegatedAccess, getMetaIncomingDelegatedAccess } from './helper';

export type MetaIncomingDelegatedAccess = ReturnType<typeof getMetaIncomingDelegatedAccess>;
export type EnrichedIncomingDelegatedAccess = ReturnType<typeof getEnrichedIncomingDelegatedAccess>;

export interface DeleteActionPayload {
    type: 'delete';
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

export type ActionPayload =
    | RequestAccessActionPayload
    | CancelRequestAccessActionPayload
    | DeleteActionPayload
    | AccessActionPayload;
export type ActionListener = (payload: ActionPayload) => undefined;
