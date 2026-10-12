import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useAutomaticCurrency } from '@proton/payments-ui/client-extensions/useAutomaticCurrency';
import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import OfferSubscription from '../helpers/offerSubscription';
import { withResolvedRefs } from '../helpers/withResolvedRefs';
import useOfferFlags from '../hooks/useOfferFlags';
import type { OfferConfig, Operation } from '../interface';

export interface BlackFriday2026EligibilityArgs {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
    preferredCurrency: Currency;
}

interface Params {
    configuration: OfferConfig;
    getIsEligible: (args: BlackFriday2026EligibilityArgs) => boolean;
}

/**
 * Loads everything a Black Friday 2026 offer needs to decide whether it should show and to render itself.
 *
 * Every offer in the campaign resolves the same inputs (user, subscription, app, currency, offer flags)
 * and differs only in its configuration and its eligibility rule, so each operation's `useOffer` is a
 * one-line call into this hook rather than a copy of the same twenty lines.
 */
export const useBlackFriday2026Offer = ({ configuration, getIsEligible }: Params): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const paidSubscription = isPaidSubscription(subscription) ? subscription : undefined;
    const protonConfig = useConfig();
    const { APP_NAME } = protonConfig;
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    const { pathname } = useLocation();

    const config = useMemo(() => {
        const offerSubscription = paidSubscription ? new OfferSubscription(paidSubscription) : undefined;
        return withResolvedRefs(configuration, APP_NAME, pathname, offerSubscription);
    }, [configuration, APP_NAME, paidSubscription, pathname]);

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
