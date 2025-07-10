import { select } from 'redux-saga/effects';

import { WEBSITE_RULES_EXPERIMENTAL_URL, WEBSITE_RULES_URL } from '@proton/pass/constants';
import { fetchIfModified } from '@proton/pass/lib/api/utils';
import { validateRules } from '@proton/pass/lib/extension/rules/rules';
import type { DetectionRules } from '@proton/pass/lib/extension/rules/types';
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
        const url = experimental ? WEBSITE_RULES_EXPERIMENTAL_URL : WEBSITE_RULES_URL;

        const response: Maybe<Response> = yield fetchIfModified(url, lastRequestedAt);
        if (response) {
            const rules = yield response.json();
            if (validateRules(rules)) options.publish?.({ type: 'website-rules::resolved', data: rules });
        }

        return true;
    },
});
