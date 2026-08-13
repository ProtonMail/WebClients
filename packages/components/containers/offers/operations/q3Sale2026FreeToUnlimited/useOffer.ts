import { useMemo } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import { useFlag } from '@proton/unleash/useFlag';

import OfferSubscription from '../../helpers/offerSubscription';
import { withResolvedRefs } from '../../helpers/withResolvedRefs';
import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const paidSubscription = isPaidSubscription(subscription) ? subscription : undefined;
    const protonConfig = useConfig();
    const { APP_NAME } = protonConfig;
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    // Turning this flag on replays the popup once for users who saw it but didn't opt out
    const replayAutoPopUp = useFlag(CommonFeatureFlag.Q3Sale2026FreeToUnlimitedSecondPopup);

    const config = useMemo(() => {
        const offerSubscription = paidSubscription ? new OfferSubscription(paidSubscription) : undefined;

        return {
            ...withResolvedRefs(configuration, APP_NAME, window.location.pathname, offerSubscription),
            replayAutoPopUp,
        };
    }, [APP_NAME, paidSubscription, replayAutoPopUp]);

    const isEligible = getIsEligible({
        user,
        subscription: paidSubscription,
        protonConfig,
        offerConfig: configuration,
        preferredCurrency,
    });

    return {
        isValid: isEligible && isActive,
        config,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingCurrency,
        isEligible,
    };
};
