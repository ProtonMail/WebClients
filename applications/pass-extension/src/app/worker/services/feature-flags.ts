import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { DEFAULT_PASS_FEATURES } from '@proton/pass/constants';
import { getRuleVersion } from '@proton/pass/lib/extension/rules/rules';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import type { MaybeNull } from '@proton/pass/types';

export interface FeatureFlagService {
    read: () => Promise<FeatureFlagState>;
    sync: (features: FeatureFlagState) => void;
}

type FeatureFlagServiceState = { features: MaybeNull<FeatureFlagState> };

export const createFeatureFlagService = (): FeatureFlagService => {
    const state: FeatureFlagServiceState = { features: null };

    return {
        read: withContext(
            async (ctx) =>
                (state.features =
                    state.features ??
                    (await (async () => {
                        try {
                            const data = await ctx.service.storage.local.getItem('features');
                            return data ? JSON.parse(data) : DEFAULT_PASS_FEATURES;
                        } catch {
                            return DEFAULT_PASS_FEATURES;
                        }
                    })()))
        ),

        sync: withContext((ctx, features) => {
            state.features = features;

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                    payload: features,
                })
            );

            void ctx.service.storage.local.setItem('features', JSON.stringify(features));

            const { PassExperimentalWebsiteRules = false } = features;
            const currentRuleVersion = ctx.service.autofill.getRules()?.version;
            const shouldRevalidate = currentRuleVersion !== getRuleVersion(PassExperimentalWebsiteRules ?? false);

            if (shouldRevalidate) ctx.service.store.dispatch(withRevalidate(resolveWebsiteRules.intent()));
        }),
    };
};
