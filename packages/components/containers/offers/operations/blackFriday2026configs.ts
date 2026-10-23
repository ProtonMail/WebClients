import { useHasRedeemedCoupons } from '@proton/payments-ui/client-extensions/useHasRedeemedCoupons';
import { BLACK_FRIDAY_2026_COUPONS } from '@proton/payments/core/subscription/helpers';

import type { OfferConfig, Operation } from '../interface';
import { configuration as duoToFamily } from '../operations/blackFriday2026DuoToFamily/configuration';
import { useOffer as useDuoToFamily } from '../operations/blackFriday2026DuoToFamily/useOffer';
import { configuration as freeToDrivePlus } from '../operations/blackFriday2026FreeToDrivePlus/configuration';
import { useOffer as useFreeToDrivePlus } from '../operations/blackFriday2026FreeToDrivePlus/useOffer';
import { configuration as freeToMailPlus } from '../operations/blackFriday2026FreeToMailPlus/configuration';
import { useOffer as useFreeToMailPlus } from '../operations/blackFriday2026FreeToMailPlus/useOffer';
import { configuration as freeToPassPlus } from '../operations/blackFriday2026FreeToPassPlus/configuration';
import { useOffer as useFreeToPassPlus } from '../operations/blackFriday2026FreeToPassPlus/useOffer';
import { configuration as freeToUnlimited } from '../operations/blackFriday2026FreeToUnlimited/configuration';
import { useOffer as useFreeToUnlimited } from '../operations/blackFriday2026FreeToUnlimited/useOffer';
import { configuration as plusToUnlimited } from '../operations/blackFriday2026PlusToUnlimited/configuration';
import { useOffer as usePlusToUnlimited } from '../operations/blackFriday2026PlusToUnlimited/useOffer';
import { configuration as unlimitedToDuo } from '../operations/blackFriday2026UnlimitedToDuo/configuration';
import { useOffer as useUnlimitedToDuo } from '../operations/blackFriday2026UnlimitedToDuo/useOffer';
import type { BlackFriday2026OfferId } from './blackFriday2026offers';

export const blackFriday2026Configs: Record<BlackFriday2026OfferId, OfferConfig> = {
    'black-friday-2026-unlimited-to-duo': unlimitedToDuo,
    'black-friday-2026-duo-to-family': duoToFamily,
    'black-friday-2026-plus-to-unlimited': plusToUnlimited,
    'black-friday-2026-free-to-unlimited': freeToUnlimited,

    'black-friday-2026-free-to-mail-plus': freeToMailPlus,
    'black-friday-2026-free-to-drive-plus': freeToDrivePlus,
    'black-friday-2026-free-to-pass-plus': freeToPassPlus,
};

export function useBlackFriday2026(): Operation[] {
    // Within a wave the audiences are disjoint, by plan or by app, so at most one offer matches a user.
    // The paid offers (Unlimited to Duo, Duo to Family, Plus to Unlimited) run across both waves and
    // never overlap the free offers. The free waves share an audience and are separated in time by the
    // Offers feature, which switches each offer on and off. Wave 1 is listed first so that if both are
    // briefly on during the handover, wave 1 keeps serving rather than either going dark.
    const unlimitedToDuo = useUnlimitedToDuo();
    const duoToFamily = useDuoToFamily();
    const plusToUnlimited = usePlusToUnlimited();

    const freeToUnlimited = useFreeToUnlimited();

    const freeToMailPlus = useFreeToMailPlus();
    const freeToDrivePlus = useFreeToDrivePlus();
    const freeToPassPlus = useFreeToPassPlus();

    const operations = [
        unlimitedToDuo,
        duoToFamily,
        plusToUnlimited,
        freeToUnlimited,
        freeToMailPlus,
        freeToDrivePlus,
        freeToPassPlus,
    ];

    // A user who has redeemed any BF 2026 coupon sees no further campaign offer. Only users who would
    // otherwise see one need their redemption history, which keeps the request off everyone else's load.
    const hasOfferToShow = operations.some((operation) => !operation.isLoading && operation.isValid);
    const { hasRedeemed, loading } = useHasRedeemedCoupons({
        coupons: BLACK_FRIDAY_2026_COUPONS,
        enabled: hasOfferToShow,
    });

    return operations.map((operation) => {
        return {
            ...operation,
            isValid: operation.isValid && !hasRedeemed,
            isLoading: operation.isLoading || loading,
        };
    });
}
