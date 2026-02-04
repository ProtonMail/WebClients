import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { DEFAULT_PASS_FEATURES } from '@proton/pass/constants';
import { getRuleVersion } from '@proton/pass/lib/extension/rules/rules';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import type { FeatureFlagAndVariantState, FeatureFlagState, FeatureFlagVariants } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { logger } from '@proton/pass/utils/logger';

export interface FeatureFlagService {
    clear: () => Promise<void>;
    resolve: () => Promise<FeatureFlagAndVariantState>;
    sync: (features: FeatureFlagAndVariantState) => void;
}

type FeatureFlagServiceState = {
    features: MaybeNull<FeatureFlagState>;
    variants: MaybeNull<FeatureFlagVariants>;
};

export const createFeatureFlagService = (): FeatureFlagService => {
    /** Cache the settings to avoid constantly reading from extension
     * storage when resolving feature flags for content-scripts. */
    const state: FeatureFlagServiceState = { features: null, variants: null };

    return {
        resolve: withContext(async ({ service }) => {
            if (state.features === null) {
                try {
                    const data = await service.storage.local.getItem('features');
                    state.features = data ? JSON.parse(data) : DEFAULT_PASS_FEATURES;
                } catch {
                    logger.error('[FeatureFlagService] Failed parsing local feature flags');
                    state.features = DEFAULT_PASS_FEATURES;
                }
            }

            if (state.variants === null) {
                try {
                    const data = await service.storage.local.getItem('featureVariants');
                    state.variants = data ? JSON.parse(data) : {};
                } catch {
                    logger.error('[FeatureFlagService] Failed parsing local feature variants');
                    state.variants = {};
                }
            }

            return { features: { ...state.features }, variants: { ...state.variants } };
        }),

        clear: withContext(async ({ service }) => {
            state.features = null;
            state.variants = null;
            await service.storage.local.removeItem('features');
            await service.storage.local.removeItem('featureVariants');
        }),

        sync: withContext(({ service }, { features, variants }) => {
            state.features = { ...features };
            state.variants = { ...variants };

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                    payload: features,
                })
            );

            void service.storage.local.setItem('features', JSON.stringify(features));
            void service.storage.local.setItem('featureVariants', JSON.stringify(variants));

            const { PassExperimentalWebsiteRules = false } = features;
            const currentRuleVersion = service.autofill.getRules()?.version;
            const shouldRevalidate = currentRuleVersion !== getRuleVersion(PassExperimentalWebsiteRules ?? false);

            if (shouldRevalidate) service.store.dispatch(withRevalidate(resolveWebsiteRules.intent()));
        }),
    };
};
