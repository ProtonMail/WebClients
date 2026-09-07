import type { Plan } from '@proton/payments/core/plan/interface';

import type { PlanCardFeatureIcon } from '../../containers/payments/features/interface';

export interface UpsellFeature {
    getText: (scribeToLumo?: boolean) => string;
    getTooltip?: () => string;
    icon: PlanCardFeatureIcon;
}

export interface UpsellFeatureGetter {
    (plan?: Plan): UpsellFeature | null;
}
