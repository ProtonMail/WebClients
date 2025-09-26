import { FeatureCode, useFeatures } from '@proton/features';

import type { OfferConfig, OfferId, Operation } from '../interface';
import { anniversary2025Bundle } from '../operations/anniversary2025Bundle/configuration';
import { useAnniversary2025Bundle } from '../operations/anniversary2025Bundle/useOffer';
import { anniversary2025DrivePlus } from '../operations/anniversary2025DrivePlus/configuration';
import { useAnniversary2025DrivePlus } from '../operations/anniversary2025DrivePlus/useOffer';
import { anniversary2025Duo } from '../operations/anniversary2025Duo/configuration';
import { useAnniversary2025Duo } from '../operations/anniversary2025Duo/useOffer';
import { anniversary2025Family } from '../operations/anniversary2025Family/configuration';
import { useAnniversary2025Family } from '../operations/anniversary2025Family/useOffer';
import { anniversary2025MailPlus } from '../operations/anniversary2025MailPlus/configuration';
import { useAnniversary2025MailPlus } from '../operations/anniversary2025MailPlus/useOffer';
import { anniversary2025PassPlus } from '../operations/anniversary2025PassPlus/configuration';
import { useAnniversary2025PassPlus } from '../operations/anniversary2025PassPlus/useOffer';
import { anniversary2025VPNPlus } from '../operations/anniversary2025VPNPlus/configuration';
import { useAnniversary2025VPNPlus } from '../operations/anniversary2025VPNPlus/useOffer';
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
    'anniversary-2025-mail-plus': anniversary2025MailPlus,
    'anniversary-2025-drive-plus': anniversary2025DrivePlus,
    'anniversary-2025-vpn-plus': anniversary2025VPNPlus,
    'anniversary-2025-pass-plus': anniversary2025PassPlus,
    'anniversary-2025-bundle': anniversary2025Bundle,
    'anniversary-2025-duo': anniversary2025Duo,
    'anniversary-2025-family': anniversary2025Family,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    // Other offers
    const passFamilyPlan2024Yearly = usePassFamilyPlan2024Yearly();
    const mailTrial2023 = useMailTrial2023();
    const goUnlimited2022 = useGoUnlimited2022();

    // Anniversary 2025 offers
    const anniversary2025MailPlus = useAnniversary2025MailPlus();
    const anniversary2025DrivePlus = useAnniversary2025DrivePlus();
    const anniversary2025VPNPlus = useAnniversary2025VPNPlus();
    const anniversary2025PassPlus = useAnniversary2025PassPlus();
    const anniversary2025Bundle = useAnniversary2025Bundle();
    const anniversary2025Duo = useAnniversary2025Duo();
    const anniversary2025Family = useAnniversary2025Family();

    // Offer order matters
    const allOffers: Operation[] = [
        anniversary2025MailPlus,
        anniversary2025DrivePlus,
        anniversary2025VPNPlus,
        anniversary2025PassPlus,
        anniversary2025Bundle,
        anniversary2025Duo,
        anniversary2025Family,

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
