import type { IconName } from '@proton/icons/types';
import type { Plan } from '@proton/payments';

export interface UpsellFeature {
    getText: () => string;
    getTooltip?: () => string;
    icon: IconName;
}

export interface UpsellFeatureGetter {
    (plan?: Plan): UpsellFeature | null;
}
