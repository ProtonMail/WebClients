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

export interface RefuseAccessActionPayload {
    type: 'refuse-access';
    value: EnrichedOutgoingDelegatedAccess;
}

export interface RevokeAccessActionPayload {
    type: 'revoke-access';
    value: EnrichedOutgoingDelegatedAccess;
}

export interface ViewAccessActionPayload {
    type: 'view-access';
    value: EnrichedOutgoingDelegatedAccess;
}

export type ActionPayload =
    | AddActionPayload
    | DeleteActionPayload
    | ChangeWaitTimeActionPayload
    | GrantAccessActionPayload
    | ViewAccessActionPayload
    | RefuseAccessActionPayload
    | RevokeAccessActionPayload
    | UpsellActionPayload;
export type ActionListener = (payload: ActionPayload) => undefined;
