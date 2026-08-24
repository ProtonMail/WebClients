import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getPlanFeatures } from '../components/Monitor/utils';
import type { UpsellType } from '../components/Upsell/UpsellingModal';
import type { FeatureType } from '../components/Upsell/types';
import { selectPassPlan } from '../store/selectors';
import { UserPassPlan } from '../types/api/plan';

type UpsellPlanFeatures = {
    features: FeatureType[];
    upsellType: UpsellType;
    upgradePath?: string;
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
                : { features: planFeatures.individuals, upsellType: 'pass-monitor' };

        return { plan, features, upsellType, upgradePath };
    }, [plan]);
};
