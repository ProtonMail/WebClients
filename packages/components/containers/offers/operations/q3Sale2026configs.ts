import type { OfferConfig, Operation } from '../interface';
import { configuration as duoToFamily } from '../operations/q3Sale2026DuoToFamily/configuration';
import { useOffer as useDuoToFamily } from '../operations/q3Sale2026DuoToFamily/useOffer';
import { configuration as familyMonthlyToYearly } from '../operations/q3Sale2026FamilyMonthlyToYearly/configuration';
import { useOffer as useFamilyMonthlyToYearly } from '../operations/q3Sale2026FamilyMonthlyToYearly/useOffer';
import { configuration as freeToUnlimited } from '../operations/q3Sale2026FreeToUnlimited/configuration';
import { useOffer as useFreeToUnlimited } from '../operations/q3Sale2026FreeToUnlimited/useOffer';
import { configuration as plusToUnlimited } from '../operations/q3Sale2026PlusToUnlimited/configuration';
import { useOffer as usePlusToUnlimited } from '../operations/q3Sale2026PlusToUnlimited/useOffer';
import { configuration as unlimitedToDuo } from '../operations/q3Sale2026UnlimitedToDuo/configuration';
import { useOffer as useUnlimitedToDuo } from '../operations/q3Sale2026UnlimitedToDuo/useOffer';
import type { Q3Sale2026OfferId } from './q3Sale2026offers';

export const q3Sale2026Configs: Record<Q3Sale2026OfferId, OfferConfig> = {
    'q3-sale-2026-free-to-unlimited': freeToUnlimited,
    'q3-sale-2026-plus-to-unlimited': plusToUnlimited,

    'q3-sale-2026-unlimited-to-duo': unlimitedToDuo,
    'q3-sale-2026-duo-to-family': duoToFamily,
    'q3-sale-2026-family-monthly-to-yearly': familyMonthlyToYearly,
};

export function useQ3Sale2026(): Operation[] {
    // None of these offers are scoped to an app: they all run in Inbox and Drive, and their tracking
    // refs record which product the user converted from. The audiences are disjoint by plan
    // (Unlimited / Duo / Family monthly / single-product paid / free), so exactly one should match any
    // given user. Ordered most-specific first as a safety net.
    const unlimitedToDuo = useUnlimitedToDuo();
    const duoToFamily = useDuoToFamily();
    const familyMonthlyToYearly = useFamilyMonthlyToYearly();
    const plusToUnlimited = usePlusToUnlimited();
    const freeToUnlimited = useFreeToUnlimited();

    return [unlimitedToDuo, duoToFamily, familyMonthlyToYearly, plusToUnlimited, freeToUnlimited];
}
