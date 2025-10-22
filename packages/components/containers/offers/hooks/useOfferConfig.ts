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
import { blackFriday2025DriveFreeMonthlyConfig } from '../operations/blackFriday2025DriveFreeMonthly/configuration';
import { useBlackFriday2025DriveFreeMonthly } from '../operations/blackFriday2025DriveFreeMonthly/useOffer';
import { blackFriday2025DriveFreeYearlyConfig } from '../operations/blackFriday2025DriveFreeYearly/configuration';
import { useBlackFriday2025DriveFreeYearly } from '../operations/blackFriday2025DriveFreeYearly/useOffer';
import { blackFriday2025DrivePlusMonthly2Config } from '../operations/blackFriday2025DrivePlusMonthly2/configuration';
import { useBlackFriday2025DrivePlusMonthly2 } from '../operations/blackFriday2025DrivePlusMonthly2/useOffer';
import { blackFriday2025DrivePlusMonthlyConfig } from '../operations/blackFriday2025DrivePlusMonthly/configuration';
import { useBlackFriday2025DrivePlusMonthly } from '../operations/blackFriday2025DrivePlusMonthly/useOffer';
import { blackFriday2025DrivePlusYearlyConfig } from '../operations/blackFriday2025DrivePlusYearly/configuration';
import { useBlackFriday2025DrivePlusYearly } from '../operations/blackFriday2025DrivePlusYearly/useOffer';
import { blackFriday2025DuoConfig } from '../operations/blackFriday2025Duo/configuration';
import { useBlackFriday2025Duo } from '../operations/blackFriday2025Duo/useOffer';
import { blackFriday2025FamilyMonthlyConfig } from '../operations/blackFriday2025FamilyMonthly/configuration';
import { useBlackFriday2025FamilyMonthly } from '../operations/blackFriday2025FamilyMonthly/useOffer';
import { blackFriday2025InboxFreeMonthlyConfig } from '../operations/blackFriday2025InboxFreeMonthly/configuration';
import { useBlackFriday2025InboxFreeMonthly } from '../operations/blackFriday2025InboxFreeMonthly/useOffer';
import { blackFriday2025InboxFreeYearlyConfig } from '../operations/blackFriday2025InboxFreeYearly/configuration';
import { useBlackFriday2025InboxFreeYearly } from '../operations/blackFriday2025InboxFreeYearly/useOffer';
import { blackFriday2025InboxPlusMonthly2Config } from '../operations/blackFriday2025InboxPlusMonthly2/configuration';
import { useBlackFriday2025InboxPlusMonthly2 } from '../operations/blackFriday2025InboxPlusMonthly2/useOffer';
import { blackFriday2025InboxPlusMonthlyConfig } from '../operations/blackFriday2025InboxPlusMonthly/configuration';
import { useBlackFriday2025InboxPlusMonthly } from '../operations/blackFriday2025InboxPlusMonthly/useOffer';
import { blackFriday2025InboxPlusYearly2Config } from '../operations/blackFriday2025InboxPlusYearly2/configuration';
import { useBlackFriday2025InboxPlusYearly2 } from '../operations/blackFriday2025InboxPlusYearly2/useOffer';
import { blackFriday2025InboxPlusYearlyConfig } from '../operations/blackFriday2025InboxPlusYearly/configuration';
import { useBlackFriday2025InboxPlusYearly } from '../operations/blackFriday2025InboxPlusYearly/useOffer';
import { blackFriday2025LumoFreeYearlyConfig } from '../operations/blackFriday2025LumoFreeYearly/configuration';
import { useBlackFriday2025LumoFreeYearly } from '../operations/blackFriday2025LumoFreeYearly/useOffer';
import { blackFriday2025LumoPlusMonthlyConfig } from '../operations/blackFriday2025LumoPlusMonthly/configuration';
import { useBlackFriday2025LumoPlusMonthly } from '../operations/blackFriday2025LumoPlusMonthly/useOffer';
import { blackFriday2025PassFreeMonthlyConfig } from '../operations/blackFriday2025PassFreeMonthly/configuration';
import { useBlackFriday2025PassFreeMonthly } from '../operations/blackFriday2025PassFreeMonthly/useOffer';
import { blackFriday2025PassFreeYearlyConfig } from '../operations/blackFriday2025PassFreeYearly/configuration';
import { useBlackFriday2025PassFreeYearly } from '../operations/blackFriday2025PassFreeYearly/useOffer';
import { blackFriday2025PassPlusMonthly2Config } from '../operations/blackFriday2025PassPlusMonthly2/configuration';
import { useBlackFriday2025PassPlusMonthly2 } from '../operations/blackFriday2025PassPlusMonthly2/useOffer';
import { blackFriday2025PassPlusMonthlyConfig } from '../operations/blackFriday2025PassPlusMonthly/configuration';
import { useBlackFriday2025PassPlusMonthly } from '../operations/blackFriday2025PassPlusMonthly/useOffer';
import { blackFriday2025PassPlusYearlyConfig } from '../operations/blackFriday2025PassPlusYearly/configuration';
import { useBlackFriday2025PassPlusYearly } from '../operations/blackFriday2025PassPlusYearly/useOffer';
import { blackFriday2025UnlimitedConfig } from '../operations/blackFriday2025Unlimited/configuration';
import { useBlackFriday2025Unlimited } from '../operations/blackFriday2025Unlimited/useOffer';
import { blackFriday2025VPNFreeMonthlyConfig } from '../operations/blackFriday2025VPNFreeMonthly/configuration';
import { useBlackFriday2025VPNFreeMonthly } from '../operations/blackFriday2025VPNFreeMonthly/useOffer';
import { blackFriday2025VPNFreeYearlyConfig } from '../operations/blackFriday2025VPNFreeYearly/configuration';
import { useBlackFriday2025VPNFreeYearly } from '../operations/blackFriday2025VPNFreeYearly/useOffer';
import { blackFriday2025VPNPlusMonthly2Config } from '../operations/blackFriday2025VPNPlusMonthly2/configuration';
import { useBlackFriday2025VPNPlusMonthly2 } from '../operations/blackFriday2025VPNPlusMonthly2/useOffer';
import { blackFriday2025VPNPlusMonthlyConfig } from '../operations/blackFriday2025VPNPlusMonthly/configuration';
import { useBlackFriday2025VPNPlusMonthly } from '../operations/blackFriday2025VPNPlusMonthly/useOffer';
import { blackFriday2025VPNPlusTwoYearConfig } from '../operations/blackFriday2025VPNPlusTwoYear/configuration';
import { useBlackFriday2025VPNPlusTwoYear } from '../operations/blackFriday2025VPNPlusTwoYear/useOffer';
import { blackFriday2025VPNPlusYearly2Config } from '../operations/blackFriday2025VPNPlusYearly2/configuration';
import { useBlackFriday2025VPNPlusYearly2 } from '../operations/blackFriday2025VPNPlusYearly2/useOffer';
import { blackFriday2025VPNPlusYearlyConfig } from '../operations/blackFriday2025VPNPlusYearly/configuration';
import { useBlackFriday2025VPNPlusYearly } from '../operations/blackFriday2025VPNPlusYearly/useOffer';
import { goUnlimited2022Config } from '../operations/goUnlimited2022/configuration';
import { useGoUnlimited2022 } from '../operations/goUnlimited2022/useOffer';
import { mailTrial2023Config } from '../operations/mailTrial2023/configuration';
import { useMailTrial2023 } from '../operations/mailTrial2023/useOffer';
import { passFamilyPlan2024YearlyConfig } from '../operations/passFamilyPlan2024Yearly/configuration';
import { usePassFamilyPlan2024Yearly } from '../operations/passFamilyPlan2024Yearly/useOffer';

const configs: Record<OfferId, OfferConfig> = {
    'black-friday-2025-inbox-free-yearly': blackFriday2025InboxFreeYearlyConfig,
    'black-friday-2025-inbox-free-monthly': blackFriday2025InboxFreeMonthlyConfig,
    'black-friday-2025-inbox-plus-monthly': blackFriday2025InboxPlusMonthlyConfig,
    'black-friday-2025-inbox-plus-monthly2': blackFriday2025InboxPlusMonthly2Config,
    'black-friday-2025-inbox-plus-yearly': blackFriday2025InboxPlusYearlyConfig,
    'black-friday-2025-inbox-plus-yearly2': blackFriday2025InboxPlusYearly2Config,
    'black-friday-2025-unlimited': blackFriday2025UnlimitedConfig,
    'black-friday-2025-duo': blackFriday2025DuoConfig,
    'black-friday-2025-family-monthly': blackFriday2025FamilyMonthlyConfig,
    'black-friday-2025-vpn-free-yearly': blackFriday2025VPNFreeYearlyConfig,
    'black-friday-2025-vpn-free-monthly': blackFriday2025VPNFreeMonthlyConfig,
    'black-friday-2025-vpn-plus-monthly': blackFriday2025VPNPlusMonthlyConfig,
    'black-friday-2025-vpn-plus-monthly2': blackFriday2025VPNPlusMonthly2Config,
    'black-friday-2025-vpn-plus-yearly': blackFriday2025VPNPlusYearlyConfig,
    'black-friday-2025-vpn-plus-yearly2': blackFriday2025VPNPlusYearly2Config,
    'black-friday-2025-vpn-plus-two-year': blackFriday2025VPNPlusTwoYearConfig,
    'black-friday-2025-drive-free-yearly': blackFriday2025DriveFreeYearlyConfig,
    'black-friday-2025-drive-free-monthly': blackFriday2025DriveFreeMonthlyConfig,
    'black-friday-2025-drive-plus-monthly': blackFriday2025DrivePlusMonthlyConfig,
    'black-friday-2025-drive-plus-monthly2': blackFriday2025DrivePlusMonthly2Config,
    'black-friday-2025-drive-plus-yearly': blackFriday2025DrivePlusYearlyConfig,
    'black-friday-2025-pass-free-yearly': blackFriday2025PassFreeYearlyConfig,
    'black-friday-2025-pass-free-monthly': blackFriday2025PassFreeMonthlyConfig,
    'black-friday-2025-pass-plus-monthly': blackFriday2025PassPlusMonthlyConfig,
    'black-friday-2025-pass-plus-monthly2': blackFriday2025PassPlusMonthly2Config,
    'black-friday-2025-pass-plus-yearly': blackFriday2025PassPlusYearlyConfig,
    'black-friday-2025-lumo-free-yearly': blackFriday2025LumoFreeYearlyConfig,
    'black-friday-2025-lumo-plus-monthly': blackFriday2025LumoPlusMonthlyConfig,
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

    const blackFriday2025InboxFreeYearly = useBlackFriday2025InboxFreeYearly();
    const blackFriday2025InboxFreeMonthly = useBlackFriday2025InboxFreeMonthly();
    const blackFriday2025InboxPlusMonthly = useBlackFriday2025InboxPlusMonthly();
    const blackFriday2025InboxPlusMonthly2 = useBlackFriday2025InboxPlusMonthly2();
    const blackFriday2025InboxPlusYearly = useBlackFriday2025InboxPlusYearly();
    const blackFriday2025InboxPlusYearly2 = useBlackFriday2025InboxPlusYearly2();
    const blackFriday2025Unlimited = useBlackFriday2025Unlimited();
    const blackFriday2025Duo = useBlackFriday2025Duo();
    const blackFriday2025FamilyMonthly = useBlackFriday2025FamilyMonthly();

    const blackFriday2025VPNFreeYearly = useBlackFriday2025VPNFreeYearly();
    const blackFriday2025VPNFreeMonthly = useBlackFriday2025VPNFreeMonthly();
    const blackFriday2025VPNPlusMonthly = useBlackFriday2025VPNPlusMonthly();
    const blackFriday2025VPNPlusMonthly2 = useBlackFriday2025VPNPlusMonthly2();
    const blackFriday2025VPNPlusYearly = useBlackFriday2025VPNPlusYearly();
    const blackFriday2025VPNPlusYearly2 = useBlackFriday2025VPNPlusYearly2();
    const blackFriday2025VPNPlusTwoYear = useBlackFriday2025VPNPlusTwoYear();

    const blackFriday2025DriveFreeYearly = useBlackFriday2025DriveFreeYearly();
    const blackFriday2025DriveFreeMonthly = useBlackFriday2025DriveFreeMonthly();
    const blackFriday2025DrivePlusMonthly = useBlackFriday2025DrivePlusMonthly();
    const blackFriday2025DrivePlusMonthly2 = useBlackFriday2025DrivePlusMonthly2();
    const blackFriday2025DrivePlusYearly = useBlackFriday2025DrivePlusYearly();

    const blackFriday2025PassFreeYearly = useBlackFriday2025PassFreeYearly();
    const blackFriday2025PassFreeMonthly = useBlackFriday2025PassFreeMonthly();
    const blackFriday2025PassPlusMonthly = useBlackFriday2025PassPlusMonthly();
    const blackFriday2025PassPlusMonthly2 = useBlackFriday2025PassPlusMonthly2();
    const blackFriday2025PassPlusYearly = useBlackFriday2025PassPlusYearly();

    const blackFriday2025LumoFreeYearly = useBlackFriday2025LumoFreeYearly();
    const blackFriday2025LumoPlusMonthly = useBlackFriday2025LumoPlusMonthly();

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
        blackFriday2025InboxFreeYearly,
        blackFriday2025InboxFreeMonthly,
        blackFriday2025InboxPlusMonthly,
        blackFriday2025InboxPlusMonthly2,
        blackFriday2025InboxPlusYearly,
        blackFriday2025InboxPlusYearly2,
        blackFriday2025Unlimited,
        blackFriday2025Duo,
        blackFriday2025FamilyMonthly,

        blackFriday2025VPNFreeYearly,
        blackFriday2025VPNFreeMonthly,
        blackFriday2025VPNPlusMonthly,
        blackFriday2025VPNPlusMonthly2,
        blackFriday2025VPNPlusYearly,
        blackFriday2025VPNPlusYearly2,
        blackFriday2025VPNPlusTwoYear,

        blackFriday2025DriveFreeYearly,
        blackFriday2025DriveFreeMonthly,
        blackFriday2025DrivePlusMonthly,
        blackFriday2025DrivePlusMonthly2,
        blackFriday2025DrivePlusYearly,

        blackFriday2025PassFreeYearly,
        blackFriday2025PassFreeMonthly,
        blackFriday2025PassPlusMonthly,
        blackFriday2025PassPlusMonthly2,
        blackFriday2025PassPlusYearly,

        blackFriday2025LumoFreeYearly,
        blackFriday2025LumoPlusMonthly,

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
