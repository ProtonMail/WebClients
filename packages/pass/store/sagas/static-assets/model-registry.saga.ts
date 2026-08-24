import { select } from 'redux-saga/effects';

import { MODEL_REGISTRY_URL } from '../../../constants';
import { fetchIfModified } from '../../../lib/api/utils';
import { validateModelRegistry } from '../../../lib/extension/model-registry/model-registry';
import type { ModelRegistry } from '../../../lib/extension/model-registry/model-registry';
import type { Maybe } from '../../../types';
import { logger } from '../../../utils/logger';
import { resolveModelRegistry } from '../../actions/creators/model-registry';
import { createRequestSaga } from '../../request/sagas';
import type { RequestEntry, RequestStatus } from '../../request/types';
import { selectRequest } from '../../selectors';

declare module '../../events' {
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
