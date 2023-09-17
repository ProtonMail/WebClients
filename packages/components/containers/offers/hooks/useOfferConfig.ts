import { useFeatures } from '@proton/components/hooks';

import { FeatureCode } from '../../features';
import { OfferConfig, OfferId, Operation } from '../interface';
import { blackFriday2023DriveFreeConfig, useBlackFriday2023DriveFree } from '../operations/blackFridayDrive2023Free';
import { blackFriday2023DrivePlusConfig, useBlackFriday2023DrivePlus } from '../operations/blackFridayDrive2023Plus';
import {
    blackFriday2023DriveUnlimitedConfig,
    useBlackFriday2023DriveUnlimited,
} from '../operations/blackFridayDrive2023Unlimited';
import { blackFriday2023InboxFreeConfig, useBlackFriday2023InboxFree } from '../operations/blackFridayInbox2023Free';
import { blackFriday2023InboxMailConfig, useBlackFriday2023InboxMail } from '../operations/blackFridayInbox2023Plus';
import {
    blackFriday2023InboxUnlimitedConfig,
    useBlackFriday2023InboxUnlimited,
} from '../operations/blackFridayInbox2023Unlimited';
import { blackFridayMail2022Config, useBlackFridayMail2022 } from '../operations/blackFridayMail2022';
import { blackFridayMailFree2022Config, useBlackFridayMailFree2022 } from '../operations/blackFridayMailFree2022';
import { blackFridayMailPro2022Config, useBlackFridayMailPro2022 } from '../operations/blackFridayMailPro2022';
import { blackFridayVPN1Deal2022Config, useBlackFridayVPN1Deal2022 } from '../operations/blackFridayVPN1Deal2022';
import { blackFridayVPN2Deal2022Config, useBlackFridayVPN2Deal2022 } from '../operations/blackFridayVPN2Deal2022';
import { blackFridayVPN3Deal2022Config, useBlackFridayVPN3Deal2022 } from '../operations/blackFridayVPN3Deal2022';
import { blackFriday2023VPNFreeConfig, useBlackFriday2023VPNFree } from '../operations/blackFridayVPN2023Free';
import { blackFriday2023VPNMonthlyConfig, useBlackFriday2023VPNMonthly } from '../operations/blackFridayVPN2023Monthly';
import {
    blackFriday2023VPNTwoYearsConfig,
    useBlackFriday2023VPNTwoYears,
} from '../operations/blackFridayVPN2023TwoYears';
import { blackFriday2023VPNYearlyConfig, useBlackFriday2023VPNYearly } from '../operations/blackFridayVPN2023Yearly';
import { family1Deal2023Config, useFamily1Deal2023 } from '../operations/family1Deal2023';
import { family3Deal2023Config, useFamily3Deal2023 } from '../operations/family3Deal2023';
import { goUnlimited2022Config, useGoUnlimited2022 } from '../operations/goUnlimited2022';
import { mailTrial2023Config, useMailTrial2023 } from '../operations/mailTrial2023';
import { specialOffer2022Config, useSpecialOffer2022 } from '../operations/specialOffer2022';
import { summer2023Config, useSummer2023 } from '../operations/summer2023';

const configs: Record<OfferId, OfferConfig> = {
    'go-unlimited-2022': goUnlimited2022Config,
    'special-offer-2022': specialOffer2022Config,
    'black-friday-mail-free-2022': blackFridayMailFree2022Config,
    'black-friday-mail-2022': blackFridayMail2022Config,
    'black-friday-mail-pro-2022': blackFridayMailPro2022Config,
    'black-friday-vpn-1-deal-2022': blackFridayVPN1Deal2022Config,
    'black-friday-vpn-2-deal-2022': blackFridayVPN2Deal2022Config,
    'black-friday-vpn-3-deal-2022': blackFridayVPN3Deal2022Config,
    'mail-trial-2023': mailTrial2023Config,
    'family-3-deal-2023': family3Deal2023Config,
    'family-1-deal-2023': family1Deal2023Config,
    'summer-2023': summer2023Config,
    'black-friday-2023-inbox-free': blackFriday2023InboxFreeConfig,
    'black-friday-2023-inbox-mail': blackFriday2023InboxMailConfig,
    'black-friday-2023-inbox-unlimited': blackFriday2023InboxUnlimitedConfig,
    'black-friday-2023-vpn-free': blackFriday2023VPNFreeConfig,
    'black-friday-2023-vpn-monthly': blackFriday2023VPNMonthlyConfig,
    'black-friday-2023-vpn-yearly': blackFriday2023VPNYearlyConfig,
    'black-friday-2023-vpn-two-years': blackFriday2023VPNTwoYearsConfig,
    'black-friday-2023-drive-free': blackFriday2023DriveFreeConfig,
    'black-friday-2023-drive-plus': blackFriday2023DrivePlusConfig,
    'black-friday-2023-drive-unlimited': blackFriday2023DriveUnlimitedConfig,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    const goUnlimited2022 = useGoUnlimited2022();
    const specialOffer2022 = useSpecialOffer2022();
    const blackFridayMailFree2022 = useBlackFridayMailFree2022();
    const blackFridayMail2022 = useBlackFridayMail2022();
    const blackFridayMailPro2022 = useBlackFridayMailPro2022();
    const blackFridayVPN1Deal2022 = useBlackFridayVPN1Deal2022();
    const blackFridayVPN2Deal2022 = useBlackFridayVPN2Deal2022();
    const blackFridayVPN3Deal2022 = useBlackFridayVPN3Deal2022();
    const mailTrial2023 = useMailTrial2023();
    const family3Deal2023 = useFamily3Deal2023();
    const family1Deal2023 = useFamily1Deal2023();
    const summer2023 = useSummer2023();
    const blackFriday2023InboxFree = useBlackFriday2023InboxFree();
    const blackFriday2023InboxMail = useBlackFriday2023InboxMail();
    const blackFriday2023InboxUnlimited = useBlackFriday2023InboxUnlimited();
    const blackFriday2023VPNFree = useBlackFriday2023VPNFree();
    const blackFriday2023VPNMonthly = useBlackFriday2023VPNMonthly();
    const blackFriday2023VPNYearly = useBlackFriday2023VPNYearly();
    const blackFriday2023VPNTwoYears = useBlackFriday2023VPNTwoYears();
    const blackFriday2023DriveFree = useBlackFriday2023DriveFree();
    const blackFriday2023DrivePlus = useBlackFriday2023DrivePlus();
    const blackFriday2023DriveUnlimited = useBlackFriday2023DriveUnlimited();

    // Offer order matters
    const allOffers: Operation[] = [
        blackFriday2023InboxFree,
        blackFriday2023InboxMail,
        blackFriday2023InboxUnlimited,
        blackFriday2023VPNFree,
        blackFriday2023VPNMonthly,
        blackFriday2023VPNYearly,
        blackFriday2023VPNTwoYears,
        blackFriday2023DriveFree,
        blackFriday2023DrivePlus,
        blackFriday2023DriveUnlimited,
        blackFridayMailFree2022,
        blackFridayMail2022,
        blackFridayMailPro2022,
        blackFridayVPN1Deal2022,
        blackFridayVPN2Deal2022,
        blackFridayVPN3Deal2022,
        summer2023,
        family3Deal2023,
        family1Deal2023,
        goUnlimited2022,
        specialOffer2022,
        mailTrial2023,
    ];

    const validOffer: Operation | undefined = allOffers.find((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
