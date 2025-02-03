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
import { valentineDrive2025 } from '../operations/valentine2025Drive/configuration';
import { useValentine2025Drive } from '../operations/valentine2025Drive/useOffer';
import { valentineDriveBundle2025 } from '../operations/valentine2025DriveBundle/configuration';
import { useValentine2025DriveBundle } from '../operations/valentine2025DriveBundle/useOffer';
import { valentineMail2025 } from '../operations/valentine2025Mail/configuration';
import { useValentine2025Mail } from '../operations/valentine2025Mail/useOffer';
import { valentineMailBundle2025 } from '../operations/valentine2025MailBundle/configuration';
import { useValentine2025MailBundle } from '../operations/valentine2025MailBundle/useOffer';
import { valentinePass2025 } from '../operations/valentine2025Pass/configuration';
import { useValentine2025Pass } from '../operations/valentine2025Pass/useOffer';
import { valentinePassBundle2025 } from '../operations/valentine2025PassBundle/configuration';
import { useValentine2025PassBundle } from '../operations/valentine2025PassBundle/useOffer';
import { valentineVPN2025 } from '../operations/valentine2025VPN/configuration';
import { useValentine2025VPN } from '../operations/valentine2025VPN/useOffer';
import { valentineVPNBundle2025 } from '../operations/valentine2025VPNBundle/configuration';
import { useValentine2025VPNBundle } from '../operations/valentine2025VPNBundle/useOffer';

const configs: Record<OfferId, OfferConfig> = {
    'pass-family-plan-2024-yearly': passFamilyPlan2024YearlyConfig,
    'mail-trial-2024': mailTrial2024Config,
    'mail-trial-2023': mailTrial2023Config,
    'go-unlimited-2022': goUnlimited2022Config,
    'valentine-2025-mail-plus': valentineMail2025,
    'valentine-2025-mail-bundle': valentineMailBundle2025,
    'valentine-2025-drive-plus': valentineDrive2025,
    'valentine-2025-drive-bundle': valentineDriveBundle2025,
    'valentine-2025-vpn-plus': valentineVPN2025,
    'valentine-2025-vpn-bundle': valentineVPNBundle2025,
    'valentine-2025-pass-plus': valentinePass2025,
    'valentine-2025-pass-bundle': valentinePassBundle2025,
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

    // Valentine day offers
    const valentine2025Mail = useValentine2025Mail();
    const valentine2025Drive = useValentine2025Drive();
    const valentine2025VPN = useValentine2025VPN();
    const valentine2025Pass = useValentine2025Pass();
    const valentine2025MailBundle = useValentine2025MailBundle();
    const valentine2025DriveBundle = useValentine2025DriveBundle();
    const valentine2025PassBundle = useValentine2025PassBundle();
    const valentine2025VPNBundle = useValentine2025VPNBundle();

    // Offer order matters
    const allOffers: Operation[] = [
        valentine2025Mail,
        valentine2025Drive,
        valentine2025VPN,
        valentine2025Pass,
        valentine2025MailBundle,
        valentine2025DriveBundle,
        valentine2025PassBundle,
        valentine2025VPNBundle,

        passFamilyPlan2024Yearly,
        mailTrial2024,
        mailTrial2023,
        goUnlimited2022,
    ];

    const validOffers: Operation[] | undefined = allOffers.filter((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);
    const [validOffer] = validOffers;

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
