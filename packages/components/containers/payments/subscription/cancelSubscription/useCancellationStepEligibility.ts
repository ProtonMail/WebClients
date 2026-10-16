import { useSubscription } from '@proton/account/subscription/hooks';
import { hasPassLaunchOffer } from '@proton/payments/core/subscription/helpers';

export const useCancellationStepEligibility = () => {
    const [subscription] = useSubscription();

    const canShowPassLaunchOffer = async () => {
        return !!subscription && hasPassLaunchOffer(subscription);
    };

    return { canShowPassLaunchOffer };
};
