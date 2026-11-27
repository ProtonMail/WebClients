import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getPlanFeatures } from '../components/Monitor/utils';
import type { UpsellType } from '../components/Upsell/UpsellingModal';
import type { FeatureType } from '../components/Upsell/types';
import { isPassB2BPlan } from '../lib/user/user.plan';
import { selectPassPlan, selectUserPlan } from '../store/selectors/user';

type UpsellPlanFeatures = {
    features: FeatureType[];
    upsellType: UpsellType;
    upgradePath?: string;
};

export const useUpsellPlanFeatures = () => {
    const plan = useSelector(selectPassPlan);
    const b2b = isPassB2BPlan(useSelector(selectUserPlan));
    const planFeatures = useMemo(() => getPlanFeatures(), []);

    return useMemo(() => {
        const { features, upsellType, upgradePath }: UpsellPlanFeatures = b2b
            ? {
                  features: planFeatures.business,
                  upsellType: 'pass-monitor-business',
                  upgradePath: 'pass/signup/business',
              }
            : { features: planFeatures.individuals, upsellType: 'pass-monitor' };

        return { plan, features, upsellType, upgradePath };
    }, [plan, b2b]);
};
