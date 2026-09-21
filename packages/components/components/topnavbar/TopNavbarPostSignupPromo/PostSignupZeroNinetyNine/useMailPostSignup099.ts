import { useLocation } from 'react-router';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { domIsBusy } from '@proton/shared/lib/busy';
import { useFlag } from '@proton/unleash/useFlag';

import type { OfferHookReturnValue } from '../common/helpers/interface';
import { isRootFolder } from '../common/topNavbarPromoHelpers';
import type { ZeroNinetyNineOfferState } from './interface';
import { getIsUserEligibleForZeroNinetyNine } from './mailPostSignup099Helper';
import { shouldOpenZeroNinetyNineOffer } from './zeroNinetyNineOfferState';

export const useMailPostSignup099 = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();

    // The offer should not be opened if the user has selected a conversation / message.
    // Only when in the root of a folder, regardless of the folder
    const { pathname } = useLocation();
    const isNotInFolder = isRootFolder(pathname);

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isPromoEnabled = useFlag('MailPostSignupZeroNinetyNinePromo');

    // Reminder state for this offer, and the permanent opt-out. The opt-out is stored
    // separately from the Unleash flag so switching the offer off and on again does not
    // resurface it for anyone who dismissed it.
    const { feature: offerState, loading: offerStateLoading } = useFeature<ZeroNinetyNineOfferState>(
        FeatureCode.MailPostSignupZeroNinetyNineState
    );
    const { feature: hideOffer, loading: hideOfferLoading } = useFeature<boolean>(
        FeatureCode.HideMailPostSignupZeroNinetyNineOffer
    );

    const isDomBusy = domIsBusy();

    return {
        isEligible:
            isPromoEnabled &&
            !hideOffer?.Value &&
            getIsUserEligibleForZeroNinetyNine({
                user,
                subscription,
                protonConfig,
                parentApp,
                offerStartDateTimeStamp: offerState?.Value?.offerStartDate ?? 0,
            }),
        isLoading: !!(userLoading || subscriptionLoading || offerStateLoading || hideOfferLoading),
        openSpotlight: isNotInFolder && shouldOpenZeroNinetyNineOffer(offerState?.Value) && !isDomBusy,
    };
};
