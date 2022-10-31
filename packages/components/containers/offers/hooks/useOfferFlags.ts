import { useFeature, useSubscription } from '@proton/components/hooks';
import { hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import { hasBlackFridayDiscount } from '@proton/shared/lib/helpers/subscription';

import { FeatureCode } from '../../features';
import { OfferConfig, OfferGlobalFeatureCodeValue, OfferUserFeatureCodeValue } from '../interface';

const { Default, Visited, Hide } = OfferUserFeatureCodeValue;

const useOfferFlags = (config: OfferConfig) => {
    const [subscription, subscriptionLoading] = useSubscription();
    const { feature: globalFlag, loading: globalFlagLoading } = useFeature<OfferGlobalFeatureCodeValue>(
        FeatureCode.Offers
    );
    const {
        feature: userFlag,
        loading: userFlagLoading,
        update: userFlagUpdate,
    } = useFeature<OfferUserFeatureCodeValue>(config.featureCode);

    const userFlagValue = userFlag?.Value || Default;
    const hasSubscribedToBFOffer = hasBlackFridayDiscount(subscription);

    return {
        loading: globalFlagLoading || userFlagLoading || subscriptionLoading,
        isActive: globalFlag?.Value?.[config.ID] === true && !hasBit(userFlagValue, Hide),
        isVisited: hasBit(userFlagValue, Visited) || hasSubscribedToBFOffer,
        handleHide: () => {
            const nextValue = setBit(userFlagValue, Hide);
            if (nextValue === userFlagValue) {
                return;
            }

            return userFlagUpdate(nextValue);
        },
        handleVisit: () => {
            const nextValue = setBit(userFlagValue, Visited);
            if (nextValue === userFlagValue) {
                return;
            }

            return userFlagUpdate(nextValue);
        },
    };
};

export default useOfferFlags;
