import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useAutomaticCurrency } from '@proton/payments-ui/client-extensions/useAutomaticCurrency';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import OfferSubscription from '../../helpers/offerSubscription';
import { withResolvedRefs } from '../../helpers/withResolvedRefs';
import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';
import { useTryDuo2026Discount } from './useTryDuo2026Discount';
import { useUnlimitedToDuoDiscountedTelemetry } from './useUnlimitedToDuoDiscountedTelemetry';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const paidSubscription = isPaidSubscription(subscription) ? subscription : undefined;
    const protonConfig = useConfig();
    const { APP_NAME } = protonConfig;
    const { pathname } = useLocation();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isHidden, loading: flagsLoading } = useOfferFlags(configuration);
    const enabled = useFlag(CommonFeatureFlag.UnlimitedToDuoDiscountedOffer);
    const {
        sendReportClickTopNavbar,
        sendReportClickUpsellButton,
        sendReportCloseOffer,
        sendReportClickHideOffer,
        sendReportUserSubscribed,
    } = useUnlimitedToDuoDiscountedTelemetry();

    const isEligible = getIsEligible({
        user,
        subscription: paidSubscription,
        protonConfig,
        offerConfig: configuration,
        preferredCurrency,
        pathname,
    });

    const isCandidate = enabled && !isHidden && isEligible;

    const { discount, loading: loadingDiscount } = useTryDuo2026Discount({ enabled: isCandidate });

    const isValid = isCandidate && !!discount;

    const config = useMemo(() => {
        const offerSubscription = paidSubscription ? new OfferSubscription(paidSubscription) : undefined;

        return {
            // Fills in the app the user is actually in, so the tracking ref distinguishes Mail from
            // Calendar and Drive.
            ...withResolvedRefs(configuration, APP_NAME, pathname, offerSubscription),
            topButtonDiscount: discount,
            tracking: {
                onTopNavbarClick: () => {
                    sendReportClickTopNavbar();
                },
                onCloseModal: () => {
                    sendReportCloseOffer();
                },
                onSelectDeal: () => {
                    sendReportClickUpsellButton();
                },
                onHideOffer: () => {
                    sendReportClickHideOffer();
                },
                onSubscribed: () => {
                    sendReportUserSubscribed();
                },
            },
        };
        // The telemetry senders are recreated every render, so they are intentionally left out of
        // the dependencies to keep the config stable.
    }, [discount, APP_NAME, pathname, paidSubscription]);

    return {
        isValid,
        config,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingCurrency || loadingDiscount,
        isEligible,
    };
};
