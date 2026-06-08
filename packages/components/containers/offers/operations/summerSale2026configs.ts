import type { OfferConfig, Operation } from '../interface';
import { configuration as drivePlusToUnlimited } from '../operations/summerSale2026DrivePlusToUnlimited/configuration';
import { useOffer as useDrivePlusToUnlimited } from '../operations/summerSale2026DrivePlusToUnlimited/useOffer';
import { configuration as duoToFamily } from '../operations/summerSale2026DuoToFamily/configuration';
import { useOffer as useDuoToFamily } from '../operations/summerSale2026DuoToFamily/useOffer';
import { configuration as freeDriveToUnlimited } from '../operations/summerSale2026FreeDriveToUnlimited/configuration';
import { useOffer as useFreeDriveToUnlimited } from '../operations/summerSale2026FreeDriveToUnlimited/useOffer';
import { configuration as freeToDrivePlus } from '../operations/summerSale2026FreeToDrivePlus/configuration';
import { useOffer as useFreeToDrivePlus } from '../operations/summerSale2026FreeToDrivePlus/useOffer';
import { configuration as freeToMailPlus } from '../operations/summerSale2026FreeToMailPlus/configuration';
import { useOffer as useFreeToMailPlus } from '../operations/summerSale2026FreeToMailPlus/useOffer';
import { configuration as freeInboxToUnlimited } from '../operations/summerSale2026FreeToUnlimited/configuration';
import { useOffer as useFreeInboxToUnlimited } from '../operations/summerSale2026FreeToUnlimited/useOffer';
import { configuration as mailPlusMonthlyToYearly } from '../operations/summerSale2026MailPlusMonthlyToYearly/configuration';
import { useOffer as useMailPlusMonthlyToYearly } from '../operations/summerSale2026MailPlusMonthlyToYearly/useOffer';
import { configuration as plusToUnlimited } from '../operations/summerSale2026PlusToUnlimited/configuration';
import { useOffer as usePlusToUnlimited } from '../operations/summerSale2026PlusToUnlimited/useOffer';
import { configuration as unlimitedToDuo } from '../operations/summerSale2026UnlimitedToDuo/configuration';
import { useOffer as useUnlimitedToDuo } from '../operations/summerSale2026UnlimitedToDuo/useOffer';
import type { SummerSale2026OfferId } from './summerSale2026offers';

export const summerSale2026Configs: Record<SummerSale2026OfferId, OfferConfig> = {
    'summer-sale-2026-free-to-drive-plus': freeToDrivePlus,
    'summer-sale-2026-drive-plus-to-unlimited': drivePlusToUnlimited,
    'summer-sale-2026-free-to-mail-plus': freeToMailPlus,
    'summer-sale-2026-mail-plus-monthly-to-yearly': mailPlusMonthlyToYearly,

    'summer-sale-2026-free-inbox-to-unlimited': freeInboxToUnlimited,
    'summer-sale-2026-free-drive-to-unlimited': freeDriveToUnlimited,
    'summer-sale-2026-plus-to-unlimited': plusToUnlimited,

    'summer-sale-2026-unlimited-to-duo': unlimitedToDuo,
    'summer-sale-2026-duo-to-family': duoToFamily,
};

export function useSummerSale2026(): Operation[] {
    const mailPlusMonthlyToYearly = useMailPlusMonthlyToYearly();
    const plusToUnlimited = usePlusToUnlimited();
    const drivePlusToUnlimited = useDrivePlusToUnlimited();

    // freeInboxToUnlimited and freeDriveToUnlimited must come before freeToMailPlus/freeToDrivePlus:
    // Segment A (experiment flag = 1) should see Unlimited in Wave 1.
    const freeInboxToUnlimited = useFreeInboxToUnlimited();
    const freeDriveToUnlimited = useFreeDriveToUnlimited();
    const freeToMailPlus = useFreeToMailPlus();
    const freeToDrivePlus = useFreeToDrivePlus();

    const unlimitedToDuo = useUnlimitedToDuo();
    const duoToFamily = useDuoToFamily();

    return [
        mailPlusMonthlyToYearly,
        plusToUnlimited,
        drivePlusToUnlimited,
        freeInboxToUnlimited,
        freeDriveToUnlimited,
        freeToMailPlus,
        freeToDrivePlus,
        unlimitedToDuo,
        duoToFamily,
    ];
}
