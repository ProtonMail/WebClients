import { createSelector } from '@reduxjs/toolkit';

import type { Maybe, MaybeNull } from '@proton/pass/types';

import type { RequestEntry, RequestState, RequestStatus } from './types';

export const selectRequest =
    (namespaceOrId: string) =>
    ({ request }: { request: RequestState }): Maybe<RequestEntry<RequestStatus>> =>
        request?.[namespaceOrId];

export const selectRequestStatus = (namespaceOrId: string) =>
    createSelector(selectRequest(namespaceOrId), (request) => request?.status);

export const selectRequestInFlight = (namespaceOrId: string) =>
    createSelector(selectRequest(namespaceOrId), (request): MaybeNull<RequestEntry<'start'>> => {
        if (request?.status === 'start') return request;
        return null;
    });

export const selectRequestInFlightData = <D>(namespaceOrId: string) =>
    createSelector(selectRequestInFlight(namespaceOrId), (request): MaybeNull<D> => request?.data ?? null);
