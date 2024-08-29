import { select } from 'redux-saga/effects';

import { WEBSITE_RULES_URL } from '@proton/pass/constants';
import { validateRules } from '@proton/pass/lib/extension/utils/website-rules';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { websiteRulesRequest } from '@proton/pass/store/actions/requests';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { RequestEntry, RequestStatus } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';
import { msToEpoch } from '@proton/pass/utils/time/epoch';

/* Don't fetch if the rules were not modified since our last fetch */
const revalidateWebsiteRules = async (lastRequestedAt: number): Promise<boolean> => {
    if (lastRequestedAt === 0) return true;
    const header = (await fetch(WEBSITE_RULES_URL, { method: 'HEAD' })).headers.get('Last-Modified');
    const lastModified = header ? msToEpoch(new Date(header).getTime()) : 0;
    if (lastRequestedAt >= lastModified) return false;

    return true;
};

export default createRequestSaga({
    actions: resolveWebsiteRules,
    call: function* (_, { getStorage }) {
        const lastRequest: Maybe<RequestEntry<RequestStatus>> = yield select(selectRequest(websiteRulesRequest()));
        const lastRequestedAt = lastRequest?.status === 'success' ? lastRequest.requestedAt : 0;

        if (yield revalidateWebsiteRules(lastRequestedAt)) {
            const response: Response = yield fetch(WEBSITE_RULES_URL);
            const rules = yield response.json();
            if (validateRules(rules)) yield getStorage?.().setItem('websiteRules', JSON.stringify(rules));
        }

        return true;
    },
});
