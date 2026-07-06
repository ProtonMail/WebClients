import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

import { MULTICLASS_PERSON_CONFIDENCE_BOOST, PERSON_CONFIDENCE_BOOST } from './constants';

export interface ConfidenceBoostConfig {
    personConfidenceBoost: number;
    multiclassPersonConfidenceBoost: number;
}

const readBoost = (flag: FeatureFlag, fallback: number): number => {
    const client = getStandaloneUnleashClient();

    try {
        if (client?.isEnabled(flag)) {
            const variant = client.getVariant(flag);
            const value = Number(variant.payload?.value);
            if (Number.isFinite(value)) {
                return value;
            }
        }
    } catch {
        // Ignore and use the fallback.
    }

    return fallback;
};

export const getConfidenceBoostConfig = (): ConfidenceBoostConfig => ({
    personConfidenceBoost: readBoost('MeetBlurPersonConfidenceBoost', PERSON_CONFIDENCE_BOOST),
    multiclassPersonConfidenceBoost: readBoost(
        'MeetBlurMulticlassPersonConfidenceBoost',
        MULTICLASS_PERSON_CONFIDENCE_BOOST
    ),
});
