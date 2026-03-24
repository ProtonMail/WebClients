import { useSubscription } from '@proton/account/subscription/hooks';
import {
    hasBundle,
    hasBundleBiz2025,
    hasBundlePro,
    hasBundlePro2024,
    hasDrive,
    hasDrive1TB,
    hasDriveBusiness,
    hasDrivePro,
    hasDuo,
    hasFamily,
    hasMail,
    hasMailBusiness,
    hasMailPro,
    hasVisionary,
} from '@proton/payments/core/subscription/helpers';
import { useFlag } from '@proton/unleash/useFlag';

const useCancellationEligibility = () => {
    const [subscription] = useSubscription();
    const feedbackFirstCancellationEnabled = useFlag('CancellationFlowFeedbackFirst');

    const getHasB2BAccess = () => {
        if (!feedbackFirstCancellationEnabled) {
            return false;
        }

        if (
            hasMailPro(subscription) ||
            hasMailBusiness(subscription) ||
            hasBundlePro(subscription) ||
            hasBundlePro2024(subscription) ||
            hasBundleBiz2025(subscription) ||
            hasDriveBusiness(subscription) ||
            hasDrivePro(subscription)
        ) {
            return true;
        }

        return false;
    };

    const getHasB2CAccess = () => {
        if (!feedbackFirstCancellationEnabled) {
            return false;
        }

        if (
            hasMail(subscription) ||
            hasBundle(subscription) ||
            hasDuo(subscription) ||
            hasFamily(subscription) ||
            hasVisionary(subscription) ||
            hasDrive(subscription) ||
            hasDrive1TB(subscription)
        ) {
            return true;
        }

        return false;
    };

    return {
        hasB2CAccess: getHasB2CAccess(),
        hasB2BAccess: getHasB2BAccess(),
    };
};

export default useCancellationEligibility;
