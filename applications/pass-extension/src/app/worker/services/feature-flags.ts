import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { DEFAULT_PASS_FEATURES } from '@proton/pass/constants';
import { getRuleVersion } from '@proton/pass/lib/extension/rules/rules';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { logger } from '@proton/pass/utils/logger';

export interface FeatureFlagService {
    clear: () => Promise<void>;
    resolve: () => Promise<FeatureFlagState>;
    sync: (features: FeatureFlagState) => void;
}

type FeatureFlagServiceState = { features: MaybeNull<FeatureFlagState> };

export const createFeatureFlagService = (): FeatureFlagService => {
    /** Cache the settings to avoid constantly reading from extension
     * storage when resolving feature flags for content-scripts. */
    const state: FeatureFlagServiceState = { features: null };

    return {
        resolve: withContext(
            async ({ service }) =>
                (state.features =
                    state.features ??
                    (await (async () => {
                        try {
                            const data = await service.storage.local.getItem('features');
                            return data ? JSON.parse(data) : DEFAULT_PASS_FEATURES;
                        } catch {
                            logger.error('[FeatureFlagService] Failed parsing local feature flags');
                            return DEFAULT_PASS_FEATURES;
                        }
                    })()))
        ),

        clear: withContext(async ({ service }) => {
            state.features = null;
            await service.storage.local.removeItem('features');
        }),

        sync: withContext(({ service }, features) => {
            state.features = features;

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                    payload: features,
                })
            );

            void service.storage.local.setItem('features', JSON.stringify(features));

            const { PassExperimentalWebsiteRules = false } = features;
            const currentRuleVersion = service.autofill.getRules()?.version;
            const shouldRevalidate = currentRuleVersion !== getRuleVersion(PassExperimentalWebsiteRules ?? false);

            if (shouldRevalidate) service.store.dispatch(withRevalidate(resolveWebsiteRules.intent()));
        }),
    };
};
