import { fetchModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { ModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import { resolveModelArtifact } from '@proton/pass/store/actions/creators/model-artifact';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { logger } from '@proton/pass/utils/logger';

declare module '@proton/pass/store/events' {
    interface SagaEvents {
        'model-artifact::resolved': ModelArtifact;
    }
}

export default createRequestSaga({
    actions: resolveModelArtifact,
    call: function* (modelId, options) {
        const result = yield fetchModelArtifact(modelId);

        if (!result.ok) {
            logger.warn(`[ModelArtifact] ${result.error}`);
            throw new Error(result.error);
        }

        options.publish?.({ type: 'model-artifact::resolved', data: result.artifact });

        return true;
    },
});
