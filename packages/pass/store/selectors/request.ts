import type { Maybe } from '@proton/pass/types';

import type { RequestType } from '../actions/with-request';
import type { RequestEntry, RequestState } from '../reducers/request';

export const selectRequest =
    (namespaceOrId: string) =>
    ({ request }: { request: RequestState }): Maybe<RequestEntry> =>
        request?.[namespaceOrId];

export const selectRequestStatus =
    (namespaceOrId: string) =>
    ({ request }: { request: RequestState }): Maybe<RequestType> =>
        request?.[namespaceOrId]?.status;

export const selectRequestInFlight =
    (namespaceOrId: string) =>
    (state: { request: RequestState }): boolean =>
        selectRequestStatus(namespaceOrId)(state) === 'start';
