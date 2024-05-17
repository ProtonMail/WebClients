import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FeatureType } from '@proton/pass/components/Monitor/types';
import { getPlanFeatures } from '@proton/pass/components/Monitor/utils';
import type { UpsellType } from '@proton/pass/components/Upsell/UpsellingModal';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type UpsellPlanFeatures = {
    features: FeatureType[];
    upsellType: UpsellType;
};

const useUpsellPlanFeaturesHook = () => {
    const plan = useSelector(selectPassPlan);
    const [upsellPlanFeatures, setUpsellPlanFeatures] = useState<UpsellPlanFeatures | null>(null);
    const planFeatures = useMemo(() => getPlanFeatures(), []);

    useEffect(() => {
        setUpsellPlanFeatures(
            plan === UserPassPlan.BUSINESS
                ? {
                      features: planFeatures.business,
                      upsellType: 'pass-monitor-business',
                  }
                : {
                      features: planFeatures.individuals,
                      upsellType: 'pass-monitor',
                  }
        );
    }, [plan]);

    return {
        plan,
        upsellPlanFeatures,
    };
};

export default useUpsellPlanFeaturesHook;
