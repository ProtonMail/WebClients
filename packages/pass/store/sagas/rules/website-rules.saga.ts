import { select, takeLeading } from 'redux-saga/effects';

import { WEBSITE_RULES_SUPPORTED_VERSION, WEBSITE_RULES_URL } from '@proton/pass/constants';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { websiteRulesRequest } from '@proton/pass/store/actions/requests';
import type { RequestEntry, RequestStatus } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe, WebsiteRulesJson } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { msToEpoch } from '@proton/pass/utils/time/epoch';

function* resolveWebsiteRulesWorker({ getExtensionStorage }: RootSagaOptions) {
    try {
        const local = getExtensionStorage?.();
        if (!local) return;

        const lastRequest: Maybe<RequestEntry<RequestStatus>> = yield select(selectRequest(websiteRulesRequest()));
        const lastFetched = lastRequest?.status === 'success' ? lastRequest.requestedAt : 0;

        // Don't fetch if the rules were not modified since our last fetch
        const header = ((yield fetch(WEBSITE_RULES_URL, { method: 'HEAD' })) as Response).headers.get('Last-Modified');
        const lastModified = header ? msToEpoch(new Date(header).getTime()) : 0;
        if (lastFetched >= lastModified) return;

        const response: Response = yield fetch(WEBSITE_RULES_URL);
        const websiteRules: WebsiteRulesJson = yield response.json();

        if (websiteRules?.version && websiteRules.version === WEBSITE_RULES_SUPPORTED_VERSION) {
            yield local.setItem('websiteRules', JSON.stringify(websiteRules));
        }
    } catch (e) {
        logger.info(`[Rules] Could not fetch website rules JSON`, e);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(resolveWebsiteRules.intent.match, resolveWebsiteRulesWorker, options);
}
