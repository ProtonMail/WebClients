import { select } from 'redux-saga/effects';

import { MODEL_REGISTRY_URL } from '@proton/pass/constants';
import { fetchIfModified } from '@proton/pass/lib/api/utils';
import { validateModelRegistry } from '@proton/pass/lib/extension/model-registry/model-registry';
import type { ModelRegistry } from '@proton/pass/lib/extension/model-registry/model-registry';
import { resolveModelRegistry } from '@proton/pass/store/actions/creators/model-registry';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { RequestEntry, RequestStatus } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

declare module '@proton/pass/store/events' {
    interface SagaEvents {
        'model-registry::resolved': ModelRegistry;
    }
}

export default createRequestSaga({
    actions: resolveModelRegistry,
    call: function* (_, options) {
        const requestId = resolveModelRegistry.requestID();
        const lastRequest: Maybe<RequestEntry<RequestStatus>> = yield select(selectRequest(requestId));
        const lastRequestedAt = lastRequest?.status === 'success' ? lastRequest.requestedAt : 0;

        yield fetchIfModified(MODEL_REGISTRY_URL, lastRequestedAt).then(async (response) => {
            if (response?.ok) {
                const result = validateModelRegistry(await response.json());
                if (result.ok) options.publish?.({ type: 'model-registry::resolved', data: result.registry });
                else logger.warn(`[ModelRegistry] ${result.error}`);
            }
        });

        return true;
    },
});
