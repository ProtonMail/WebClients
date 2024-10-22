import { PLANS } from '@proton/payments';

import usePlans from './usePlans';

export const useHasPlan = (planName: PLANS) => {
    const [plansResult] = usePlans();
    return plansResult?.plans.some(({ Name }) => Name === planName);
};

export const useBundleProPlan = () => {
    const hasBundlePro2024 = useHasPlan(PLANS.BUNDLE_PRO_2024);
    return hasBundlePro2024 ? PLANS.BUNDLE_PRO_2024 : PLANS.BUNDLE_PRO;
};
