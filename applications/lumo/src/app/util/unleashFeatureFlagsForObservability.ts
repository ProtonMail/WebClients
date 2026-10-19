import type { ChatCompletionsFeatureFlags } from '@proton/lumo-api-client/types-api';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

const LUMO_FLAG_PREFIX = 'Lumo';

/** Unleash uses these variant names when there is no A/B arm or the toggle is off. */
const NEUTRAL_VARIANT_NAMES = new Set(['default', 'disabled']);

type UnleashToggleSnapshot = {
    name: string;
    enabled: boolean;
    variant?: {
        name: string;
        payload?: {
            value?: string;
        };
    };
};

/**
 * Maps one Unleash toggle to a single string for observability.
 *
 * - Off → `"false"`.
 * - On with no experiment arm or payload → `"true"` (typical Lumo boolean flag).
 * - On with a named variant (A/B) → the variant name (e.g. `"A"`).
 * - On with a payload → payload string, or `"<variant>|<payload>"` when both matter.
 */
export const serializeUnleashToggleForObservability = (toggle: UnleashToggleSnapshot): string => {
    if (!toggle.enabled) {
        return 'false';
    }

    const variantName = toggle.variant?.name;
    const payloadValue = toggle.variant?.payload?.value?.trim();

    if (payloadValue) {
        if (variantName && !NEUTRAL_VARIANT_NAMES.has(variantName)) {
            return `${variantName}|${payloadValue}`;
        }
        return payloadValue;
    }

    if (variantName && !NEUTRAL_VARIANT_NAMES.has(variantName)) {
        return variantName;
    }

    return 'true';
};

/**
 * Lumo-prefixed Unleash toggles at call time, for `lumo.feature_flags` on chat/completions.
 */
export const getLumoFeatureFlagsForChatCompletions = (): ChatCompletionsFeatureFlags => {
    const client = getStandaloneUnleashClient();
    if (!client) {
        return {};
    }

    const flags: ChatCompletionsFeatureFlags = {};

    for (const toggle of client.getAllToggles()) {
        if (!toggle.name.startsWith(LUMO_FLAG_PREFIX)) {
            continue;
        }
        flags[toggle.name] = serializeUnleashToggleForObservability(toggle);
    }

    return flags;
};
