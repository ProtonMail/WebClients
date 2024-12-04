import { createSelector } from '@reduxjs/toolkit';

import type { Maybe, MaybeNull } from '@proton/pass/types';

import type { RequestEntry, RequestState, RequestStatus } from './types';

export const selectRequest =
    (namespaceOrId: string) =>
    ({ request }: { request: RequestState }): Maybe<RequestEntry<RequestStatus>> =>
        request?.[namespaceOrId];

export const selectRequestInFlight = (namespaceOrId: string) =>
    createSelector(selectRequest(namespaceOrId), (request): boolean => Boolean(request?.status === 'start'));

export const selectRequestInFlightData = <D>(namespaceOrId: string) =>
    createSelector(selectRequest(namespaceOrId), (request): MaybeNull<D> => {
        if (request?.status === 'start') return request?.data ?? null;
        return null;
    });
