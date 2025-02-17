import { FeatureCode, useFeatures } from '@proton/features';

import type { OfferConfig, OfferId, Operation } from '../interface';
import { goUnlimited2022Config } from '../operations/goUnlimited2022/configuration';
import { useGoUnlimited2022 } from '../operations/goUnlimited2022/useOffer';
import { mailTrial2023Config } from '../operations/mailTrial2023/configuration';
import { useMailTrial2023 } from '../operations/mailTrial2023/useOffer';
import { mailTrial2024Config } from '../operations/mailTrial2024/configuration';
import { useMailTrial2024 } from '../operations/mailTrial2024/useOffer';
import { passFamilyPlan2024YearlyConfig } from '../operations/passFamilyPlan2024Yearly/configuration';
import { usePassFamilyPlan2024Yearly } from '../operations/passFamilyPlan2024Yearly/useOffer';

const configs: Record<OfferId, OfferConfig> = {
    'pass-family-plan-2024-yearly': passFamilyPlan2024YearlyConfig,
    'mail-trial-2024': mailTrial2024Config,
    'mail-trial-2023': mailTrial2023Config,
    'go-unlimited-2022': goUnlimited2022Config,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    // Other offers
    const passFamilyPlan2024Yearly = usePassFamilyPlan2024Yearly();
    const mailTrial2024 = useMailTrial2024();
    const mailTrial2023 = useMailTrial2023();
    const goUnlimited2022 = useGoUnlimited2022();

    // Offer order matters
    const allOffers: Operation[] = [passFamilyPlan2024Yearly, mailTrial2024, mailTrial2023, goUnlimited2022];

    const validOffers: Operation[] | undefined = allOffers.filter((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);
    const [validOffer] = validOffers;

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
