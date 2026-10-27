import { PassFeature } from '@proton/pass/types/api/features';
import type { AutofillModelExperimentGroup } from '@proton/pass/types/api/features';
import type { Maybe } from '@proton/pass/types/utils';
import { hasDownloadedModels, readModelStorage } from '@proton/pass/utils/tests/fixtures/models';

import { BUNDLED_MODEL_ID } from '../lib/utils/version';
import type { TestWorkerInit } from './worker';
import { setupWorker } from './worker';

/** `bundled`: the model shipped in the extension, used while no remote model is cached */
export type TestModel = AutofillModelExperimentGroup | 'bundled';

export type ModelWorker = ReturnType<typeof createModelWorker>;

/** Runs the worker of the calling spec on `model`, through the real selection path: experiment
 * group from the feature flags, registry and artifact from the storage. One model per spec file:
 * the content-script detector keeps the first model it resolves for the whole module. */
export const createModelWorker = (model: TestModel) => {
    let modelStorage: Maybe<Awaited<ReturnType<typeof readModelStorage>>>;

    beforeAll(async () => {
        if (model !== 'bundled') modelStorage = await readModelStorage(model);
    });

    return {
        model,
        /** Remote models are downloaded by the jest global setup, missing when offline */
        available: hasDownloadedModels(),
        getModelId: () => modelStorage?.modelId ?? BUNDLED_MODEL_ID,
        startWorker: async ({ url, state }: Omit<TestWorkerInit, 'storage'>) => {
            const featureVariants =
                model === 'bundled'
                    ? undefined
                    : { [PassFeature.PassAutofillModelExperimentGroup]: { name: model, payload: null } };

            const { autofill } = setupWorker({
                url,
                state: { ...state, featureVariants },
                storage: modelStorage?.storage,
            });
            await autofill.init();
        },
    };
};
