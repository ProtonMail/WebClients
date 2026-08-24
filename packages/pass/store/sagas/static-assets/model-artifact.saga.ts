import { fetchModelArtifact } from '../../../lib/extension/model-artifact/model-artifact';
import type { ModelArtifact } from '../../../lib/extension/model-artifact/model-artifact';
import { logger } from '../../../utils/logger';
import { resolveModelArtifact } from '../../actions/creators/model-artifact';
import { createRequestSaga } from '../../request/sagas';

declare module '../../events' {
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
