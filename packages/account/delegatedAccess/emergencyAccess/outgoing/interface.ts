import type { getEnrichedOutgoingDelegatedAccess, getMetaOutgoingDelegatedAccess } from './helper';

export type MetaIncomingDelegatedAccess = ReturnType<typeof getMetaOutgoingDelegatedAccess>;
export type EnrichedOutgoingDelegatedAccess = ReturnType<typeof getEnrichedOutgoingDelegatedAccess>;

export interface AddActionPayload {
    type: 'add';
}

export interface DeleteActionPayload {
    type: 'delete';
    value: EnrichedOutgoingDelegatedAccess;
}

export interface ChangeWaitTimeActionPayload {
    type: 'change-wait-time';
    value: EnrichedOutgoingDelegatedAccess;
}

export type ActionPayload = AddActionPayload | DeleteActionPayload | ChangeWaitTimeActionPayload;
export type ActionListener = (payload: ActionPayload) => undefined;
