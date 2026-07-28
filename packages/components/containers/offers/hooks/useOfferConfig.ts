import { useSubscription } from '@proton/account/subscription/hooks';
import { FeatureCode, useFeatures } from '@proton/features';
import { isDangerouslyAllowedSubscriptionEstimation } from '@proton/payments/core/subscription/helpers';

import type { OfferConfig, OfferId, Operation } from '../interface';
import { goUnlimited2022Config } from '../operations/goUnlimited2022/configuration';
import { useGoUnlimited2022 } from '../operations/goUnlimited2022/useOffer';
import { mailTrial2023Config } from '../operations/mailTrial2023/configuration';
import { useMailTrial2023 } from '../operations/mailTrial2023/useOffer';
import { passFamilyPlan2024YearlyConfig } from '../operations/passFamilyPlan2024Yearly/configuration';
import { usePassFamilyPlan2024Yearly } from '../operations/passFamilyPlan2024Yearly/useOffer';

const configs: Record<OfferId, OfferConfig> = {
    'pass-family-plan-2024-yearly': passFamilyPlan2024YearlyConfig,
    'mail-trial-2023': mailTrial2023Config,
    'go-unlimited-2022': goUnlimited2022Config,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = () => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);
    const [subscription, loadingSubscription] = useSubscription();

    // Other offers
    const passFamilyPlan2024Yearly = usePassFamilyPlan2024Yearly();
    const mailTrial2023 = useMailTrial2023();
    const goUnlimited2022 = useGoUnlimited2022();

    // Offer order matters
    const allOffers: Operation[] = [passFamilyPlan2024Yearly, mailTrial2023, goUnlimited2022];

    const validOffers: Operation[] = allOffers.filter((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading) || loadingSubscription;
    const validOffer = validOffers.at(0); // using at(0) for type-safety

    const config = validOffer?.config;

    // Sometimes subscription estimation endpoint will throw an error. In this case, we need to silently prefetch the
    // subscription estimation without any indication to the user. If it works, then we display the offer. If it
    // doesn't, then we don't even display the offer button or loading in the navigation.
    //
    // At the same time, not all subscription estimation calls are dangerous, so for them we don't do any pre-fetching.
    const shouldPrefetch =
        config?.deals.some((deal) => {
            return isDangerouslyAllowedSubscriptionEstimation(subscription, {
                planIDs: deal.planIDs,
                cycle: deal.cycle,
                coupon: deal.couponCode,
            });
        }) ?? false;

    return { config, isLoading, shouldPrefetch };
};

export default useOfferConfig;
