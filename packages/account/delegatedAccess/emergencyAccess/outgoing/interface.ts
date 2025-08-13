import type { getEnrichedOutgoingDelegatedAccess, getMetaOutgoingDelegatedAccess } from './helper';

export type MetaIncomingDelegatedAccess = ReturnType<typeof getMetaOutgoingDelegatedAccess>;
export type EnrichedOutgoingDelegatedAccess = ReturnType<typeof getEnrichedOutgoingDelegatedAccess>;

export interface AddActionPayload {
    type: 'add';
}

export interface UpsellActionPayload {
    type: 'upsell';
}

export interface DeleteActionPayload {
    type: 'delete';
    value: EnrichedOutgoingDelegatedAccess;
}

export interface ChangeWaitTimeActionPayload {
    type: 'change-wait-time';
    value: EnrichedOutgoingDelegatedAccess;
}

export interface GrantAccessActionPayload {
    type: 'grant-access';
    value: EnrichedOutgoingDelegatedAccess;
}

export type ActionPayload =
    | AddActionPayload
    | DeleteActionPayload
    | ChangeWaitTimeActionPayload
    | GrantAccessActionPayload
    | UpsellActionPayload;
export type ActionListener = (payload: ActionPayload) => undefined;
