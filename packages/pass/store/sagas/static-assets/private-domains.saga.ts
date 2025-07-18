import { select } from 'redux-saga/effects';

import { PRIVATE_DOMAINS_URL } from '@proton/pass/constants';
import { fetchIfModified } from '@proton/pass/lib/api/utils';
import { extractPrivateDomains } from '@proton/pass/lib/extension/tlds/parser';
import { resolvePrivateDomains } from '@proton/pass/store/actions/creators/private-domains';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { RequestEntry, RequestStatus } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';

declare module '@proton/pass/store/events' {
    interface SagaEvents {
        'private-domains::resolved': string[];
    }
}

export default createRequestSaga({
    actions: resolvePrivateDomains,
    call: function* (_, options) {
        const requestId = resolvePrivateDomains.requestID();
        const lastRequest: Maybe<RequestEntry<RequestStatus>> = yield select(selectRequest(requestId));
        const lastRequestedAt = lastRequest?.status === 'success' ? lastRequest.requestedAt : 0;

        yield fetchIfModified(PRIVATE_DOMAINS_URL, lastRequestedAt).then(async (response) => {
            if (response) {
                const data: string[] = await response.text().then(extractPrivateDomains);
                options.publish?.({ type: 'private-domains::resolved', data });
            }
        });

        return true;
    },
});
