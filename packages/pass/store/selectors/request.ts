import { createSelector } from '@reduxjs/toolkit';

import type { RequestType } from '@proton/pass/store/actions/enhancers/request';
import type { RequestEntry, RequestState } from '@proton/pass/store/reducers/request';
import type { Maybe, MaybeNull } from '@proton/pass/types';

export const selectRequest =
    <D>(namespaceOrId: string) =>
    ({ request }: { request: RequestState }): Maybe<RequestEntry<RequestType, D>> =>
        request?.[namespaceOrId];

export const selectRequestStatus = <D>(namespaceOrId: string) =>
    createSelector(selectRequest<D>(namespaceOrId), (request) => request?.status);

export const selectRequestInFlight = <D>(namespaceOrId: string) =>
    createSelector(selectRequest<D>(namespaceOrId), (request): MaybeNull<RequestEntry<'start', D>> => {
        if (request?.status === 'start') return request;
        return null;
    });

export const selectRequestInFlightData = <D>(namespaceOrId: string) =>
    createSelector(selectRequestInFlight<D>(namespaceOrId), (request): MaybeNull<D> => request?.data ?? null);
