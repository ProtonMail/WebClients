import { select } from 'redux-saga/effects';

import type { DetectionRules } from '@proton/pass/lib/extension/rules/types';
import { getDetectionRules } from '@proton/pass/lib/extension/rules/utils';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { RequestEntry, RequestStatus } from '@proton/pass/store/request/types';
import { selectFeatureFlag, selectRequest } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

declare module '@proton/pass/store/events' {
    interface SagaEvents {
        'website-rules::resolved': DetectionRules;
    }
}

export default createRequestSaga({
    actions: resolveWebsiteRules,
    call: function* (_, options) {
        const requestId = resolveWebsiteRules.requestID();
        const lastRequest: Maybe<RequestEntry<RequestStatus>> = yield select(selectRequest(requestId));
        const lastRequestedAt = lastRequest?.status === 'success' ? lastRequest.requestedAt : 0;
        const experimental: boolean = yield select(selectFeatureFlag(PassFeature.PassExperimentalWebsiteRules));

        const rules = yield getDetectionRules({ experimental, lastRequestedAt });
        if (rules) options.publish?.({ type: 'website-rules::resolved', data: rules });

        return true;
    },
});
