import { FeatureCode, useFeatures } from '@proton/features';

import type { OfferConfig, OfferId, Operation } from '../interface';
import { blackFriday2024DuoConfig, useBlackFriday2024Duo } from '../operations/blackFriday2024Duo';
import { blackFriday2024PlusConfig, useBlackFriday2024Plus } from '../operations/blackFriday2024Plus';
import { blackFriday2024UnlimitedConfig, useBlackFriday2024Unlimited } from '../operations/blackFriday2024Unlimited';
import { blackFriday2024DriveFreeConfig, useBlackFriday2024DriveFree } from '../operations/blackFridayDrive2024Free';
import {
    blackFriday2024DriveFreeYearlyConfig,
    useBlackFriday2024DriveFreeYearly,
} from '../operations/blackFridayDrive2024FreeYearly';
import { blackFriday2024InboxFreeConfig, useBlackFriday2024InboxFree } from '../operations/blackFridayInbox2024Free';
import {
    blackFriday2024InboxFreeYearlyConfig,
    useBlackFriday2024InboxFreeYearly,
} from '../operations/blackFridayInbox2024FreeYearly';
import { blackFriday2024PassFreeConfig, useBlackFriday2024PassFree } from '../operations/blackFridayPass2024Free';
import { blackFriday2024PassPlusConfig, useBlackFriday2024PassPlus } from '../operations/blackFridayPass2024Plus';
import { blackFriday2024VPNFreeConfig, useBlackFriday2024VPNFree } from '../operations/blackFridayVPN2024Free';
import {
    blackFriday2024VPNFreeYearlyConfig,
    useBlackFriday2024VPNFreeYearly,
} from '../operations/blackFridayVPN2024FreeYearly';
import { blackFriday2024VPNMonthlyConfig, useBlackFriday2024VPNMonthly } from '../operations/blackFridayVPN2024Monthly';
import { duoPlan2024TwoYearConfig, useDuoPlanTwoYear2024 } from '../operations/duoPlan2024TwoYears';
import { duoPlan2024YearlyConfig, useDuoPlan2024Yearly } from '../operations/duoPlan2024Yearly';
import { goUnlimited2022Config, useGoUnlimited2022 } from '../operations/goUnlimited2022';
import { mailTrial2023Config, useMailTrial2023 } from '../operations/mailTrial2023';
import { mailTrial2024Config, useMailTrial2024 } from '../operations/mailTrial2024';
import { passFamilyPlan2024YearlyConfig, usePassFamilyPlan2024Yearly } from '../operations/passFamilyPlan2024Yearly';
import { subscriptionReminderConfig, useSubscriptionReminder } from '../operations/subscriptionReminder';

const configs: Record<OfferId, OfferConfig> = {
    'subscription-reminder': subscriptionReminderConfig,
    'duo-plan-2024-yearly': duoPlan2024YearlyConfig,
    'duo-plan-2024-two-years': duoPlan2024TwoYearConfig,
    'go-unlimited-2022': goUnlimited2022Config,
    'mail-trial-2023': mailTrial2023Config,
    'mail-trial-2024': mailTrial2024Config,
    'pass-family-plan-2024-yearly': passFamilyPlan2024YearlyConfig,
    'black-friday-2024-inbox-free': blackFriday2024InboxFreeConfig,
    'black-friday-2024-pass-free': blackFriday2024PassFreeConfig,
    'black-friday-2024-drive-free': blackFriday2024DriveFreeConfig,
    'black-friday-2024-vpn-free': blackFriday2024VPNFreeConfig,
    'black-friday-2024-inbox-free-yearly': blackFriday2024InboxFreeYearlyConfig,
    'black-friday-2024-drive-free-yearly': blackFriday2024DriveFreeYearlyConfig,
    'black-friday-2024-vpn-free-yearly': blackFriday2024VPNFreeYearlyConfig,
    'black-friday-2024-plus': blackFriday2024PlusConfig,
    'black-friday-2024-pass-plus': blackFriday2024PassPlusConfig,
    'black-friday-2024-vpn-monthly': blackFriday2024VPNMonthlyConfig,
    'black-friday-2024-unlimited': blackFriday2024UnlimitedConfig,
    'black-friday-2024-duo': blackFriday2024DuoConfig,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    const passFamilyPlan2024Yearly = usePassFamilyPlan2024Yearly();
    const subscriptionReminder = useSubscriptionReminder();
    const duoPlan2024Yearly = useDuoPlan2024Yearly();
    const duoPlan2024TwoYear = useDuoPlanTwoYear2024();
    const goUnlimited2022 = useGoUnlimited2022();
    const mailTrial2023 = useMailTrial2023();
    const mailTrial2024 = useMailTrial2024();

    const blackFriday2024InboxFree = useBlackFriday2024InboxFree();
    const blackFriday2024PassFree = useBlackFriday2024PassFree();
    const blackFriday2024DriveFree = useBlackFriday2024DriveFree();
    const blackFriday2024VPNFree = useBlackFriday2024VPNFree();
    const blackFriday2024InboxFreeYearly = useBlackFriday2024InboxFreeYearly();
    const blackFriday2024DriveFreeYearly = useBlackFriday2024DriveFreeYearly();
    const blackFriday2024VPNFreeYearly = useBlackFriday2024VPNFreeYearly();
    const blackFriday2024Plus = useBlackFriday2024Plus();
    const blackFriday2024PassPlus = useBlackFriday2024PassPlus();
    const blackFriday2024VPNMonthly = useBlackFriday2024VPNMonthly();
    const blackFriday2024Unlimited = useBlackFriday2024Unlimited();
    const blackFriday2024Duo = useBlackFriday2024Duo();

    // Offer order matters
    const allOffers: Operation[] = [
        passFamilyPlan2024Yearly,
        blackFriday2024InboxFree,
        blackFriday2024PassFree,
        blackFriday2024DriveFree,
        blackFriday2024VPNFree,
        blackFriday2024InboxFreeYearly,
        blackFriday2024DriveFreeYearly,
        blackFriday2024VPNFreeYearly,

        blackFriday2024Plus,
        blackFriday2024PassPlus,
        blackFriday2024VPNMonthly,
        blackFriday2024Unlimited,
        blackFriday2024Duo,

        duoPlan2024Yearly,
        duoPlan2024TwoYear,
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
