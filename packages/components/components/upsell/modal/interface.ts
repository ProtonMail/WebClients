import { type IconName } from '@proton/components/components/icon/Icon';
import type { Plan } from '@proton/shared/lib/interfaces';

export interface UpsellFeature {
    getText: () => string;
    getTooltip?: () => string;
    icon: IconName;
}

export interface UpsellFeatureGetter {
    (plan?: Plan): UpsellFeature | null;
}
