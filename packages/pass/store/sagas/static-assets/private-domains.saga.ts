import { select } from 'redux-saga/effects';

import { PRIVATE_DOMAINS_URL } from '../../../constants';
import { fetchIfModified } from '../../../lib/api/utils';
import { extractPrivateDomains } from '../../../lib/extension/tlds/parser';
import type { Maybe } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { resolvePrivateDomains } from '../../actions/creators/private-domains';
import { createRequestSaga } from '../../request/sagas';
import type { RequestEntry, RequestStatus } from '../../request/types';
import { selectFeatureFlag, selectRequest } from '../../selectors';

declare module '../../events' {
    interface SagaEvents {
        'private-domains::resolved': string[];
    }
}

export default createRequestSaga({
    actions: resolvePrivateDomains,
    call: function* (_, options) {
        const customTLDsEnabled: boolean = yield select(selectFeatureFlag(PassFeature.PassExtensionCustomTLDs));
        if (!customTLDsEnabled) throw new Error('`PassExtensionCustomTLDs` disabled');

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
