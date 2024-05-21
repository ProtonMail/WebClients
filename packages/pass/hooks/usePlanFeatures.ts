import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getPlanFeatures } from '@proton/pass/components/Monitor/utils';
import type { UpsellType } from '@proton/pass/components/Upsell/UpsellingModal';
import type { FeatureType } from '@proton/pass/components/Upsell/types';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type UpsellPlanFeatures = {
    features: FeatureType[];
    upsellType: UpsellType;
    upgradePath: string;
};

export const useUpsellPlanFeatures = () => {
    const plan = useSelector(selectPassPlan);
    const planFeatures = useMemo(() => getPlanFeatures(), []);

    return useMemo(() => {
        const { features, upsellType, upgradePath }: UpsellPlanFeatures =
            plan === UserPassPlan.BUSINESS
                ? {
                      features: planFeatures.business,
                      upsellType: 'pass-monitor-business',
                      upgradePath: 'pass/signup/business',
                  }
                : { features: planFeatures.individuals, upsellType: 'pass-monitor', upgradePath: 'pass/signup' };

        return { plan, features, upsellType, upgradePath };
    }, [plan]);
};
