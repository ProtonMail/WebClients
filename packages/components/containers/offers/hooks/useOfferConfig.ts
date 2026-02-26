import { FeatureCode, useFeatures } from '@proton/features';

import type { OfferConfig, OfferId, Operation } from '../interface';
import { goUnlimited2022Config } from '../operations/goUnlimited2022/configuration';
import { useGoUnlimited2022 } from '../operations/goUnlimited2022/useOffer';
import { mailTrial2023Config } from '../operations/mailTrial2023/configuration';
import { useMailTrial2023 } from '../operations/mailTrial2023/useOffer';
import { passFamilyPlan2024YearlyConfig } from '../operations/passFamilyPlan2024Yearly/configuration';
import { usePassFamilyPlan2024Yearly } from '../operations/passFamilyPlan2024Yearly/useOffer';
import { springSale2026Configs, useSpringSale2026 } from '../operations/springSale2026configs';

const configs: Record<OfferId, OfferConfig> = {
    'pass-family-plan-2024-yearly': passFamilyPlan2024YearlyConfig,
    'mail-trial-2023': mailTrial2023Config,
    'go-unlimited-2022': goUnlimited2022Config,
    ...springSale2026Configs,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    const springSale2026Operations = useSpringSale2026();

    // Other offers
    const passFamilyPlan2024Yearly = usePassFamilyPlan2024Yearly();
    const mailTrial2023 = useMailTrial2023();
    const goUnlimited2022 = useGoUnlimited2022();

    // Offer order matters
    const allOffers: Operation[] = [
        ...springSale2026Operations,
        passFamilyPlan2024Yearly,
        mailTrial2023,
        goUnlimited2022,
    ];

    const validOffers: Operation[] | undefined = allOffers.filter((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);
    const [validOffer] = validOffers;

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
