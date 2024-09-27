import { FeatureCode, useFeatures } from '@proton/features';

import type { OfferConfig, OfferId, Operation } from '../interface';
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
import { blackFriday2023VPNFreeConfig, useBlackFriday2023VPNFree } from '../operations/blackFridayVPN2023Free';
import { blackFriday2023VPNMonthlyConfig, useBlackFriday2023VPNMonthly } from '../operations/blackFridayVPN2023Monthly';
import {
    blackFriday2023VPNTwoYearsConfig,
    useBlackFriday2023VPNTwoYears,
} from '../operations/blackFridayVPN2023TwoYears';
import { blackFriday2023VPNYearlyConfig, useBlackFriday2023VPNYearly } from '../operations/blackFridayVPN2023Yearly';
import { duoPlan2024TwoYearConfig, useDuoPlanTwoYear2024 } from '../operations/duoPlan2024TwoYears';
import { duoPlan2024YearlyConfig, useDuoPlan2024Yearly } from '../operations/duoPlan2024Yearly';
import { goUnlimited2022Config, useGoUnlimited2022 } from '../operations/goUnlimited2022';
import { mailTrial2023Config, useMailTrial2023 } from '../operations/mailTrial2023';
import { mailTrial2024Config, useMailTrial2024 } from '../operations/mailTrial2024';
import { subscriptionReminderConfig, useSubscriptionReminder } from '../operations/subscriptionReminder';

const configs: Record<OfferId, OfferConfig> = {
    'subscription-reminder': subscriptionReminderConfig,
    'duo-plan-2024-yearly': duoPlan2024YearlyConfig,
    'duo-plan-2024-two-years': duoPlan2024TwoYearConfig,
    'go-unlimited-2022': goUnlimited2022Config,
    'mail-trial-2023': mailTrial2023Config,
    'mail-trial-2024': mailTrial2024Config,
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

    const subscriptionReminder = useSubscriptionReminder();
    const duoPlan2024Yearly = useDuoPlan2024Yearly();
    const duoPlan2024TwoYear = useDuoPlanTwoYear2024();
    const goUnlimited2022 = useGoUnlimited2022();
    const mailTrial2023 = useMailTrial2023();
    const mailTrial2024 = useMailTrial2024();
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
        duoPlan2024Yearly,
        duoPlan2024TwoYear,
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
        goUnlimited2022,
        mailTrial2023,
        mailTrial2024,
        subscriptionReminder,
    ];

    const validOffers: Operation[] | undefined = allOffers.filter((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);
    const [validOffer] = validOffers;

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
