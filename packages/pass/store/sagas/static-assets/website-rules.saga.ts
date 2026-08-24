import { select } from 'redux-saga/effects';

import { WEBSITE_RULES_EXPERIMENTAL_URL, WEBSITE_RULES_URL } from '../../../constants';
import { fetchIfModified } from '../../../lib/api/utils';
import { validateRules } from '../../../lib/extension/rules/rules';
import type { DetectionRules } from '../../../lib/extension/rules/types';
import type { Maybe } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { resolveWebsiteRules } from '../../actions/creators/rules';
import { createRequestSaga } from '../../request/sagas';
import type { RequestEntry, RequestStatus } from '../../request/types';
import { selectFeatureFlag, selectRequest } from '../../selectors';

declare module '../../events' {
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

        yield fetchIfModified(url, lastRequestedAt).then(async (response) => {
            if (response) {
                const rules = await response.json();
                if (validateRules(rules)) options.publish?.({ type: 'website-rules::resolved', data: rules });
            }
        });

        return true;
    },
});
