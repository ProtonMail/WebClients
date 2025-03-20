import { useEffect, useMemo, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import Price from '@proton/components/components/price/Price';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { TelemetryPaidUsersNudge } from '@proton/shared/lib/api/telemetry';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';

import { SpotlightWithPromo } from '../../common/SpotlightWithPromo';
import { NudgeOfferContent } from '../components/NudgeOfferContent';
import { NudgeOfferSpotlight } from '../components/NudgeOfferSpotlight';
import { HIDE_OFFER } from '../components/interface';
import { isLastDayOfWindow } from '../components/paidUserNudgeHelper';
import { useGetPlanPriceWithCoupon } from '../components/useGetPlanPriceWithCoupon';
import { usePaidUsersNudgeTelemetry } from '../components/usePaidUsersNudgeTelemetry';
import { useMailPaidUsersNudge } from './useMailPaidUsersNudge';

const upsellConfig = {
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    coupon: COUPON_CODES.ANNUALOFFER25,
    cycle: CYCLE.YEARLY,
    maximumCycle: CYCLE.YEARLY,
    minimumCycle: CYCLE.YEARLY,
    plan: PLANS.MAIL,
};

export const MailPaidUsersNudge = () => {
    const { openSpotlight, isLoading } = useMailPaidUsersNudge();
    const { sendMailPlusPaidUsersNudgeReport } = usePaidUsersNudgeTelemetry();
    const { prices, loading } = useGetPlanPriceWithCoupon({ plan: PLANS.MAIL });

    const { createNotification } = useNotifications();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    const [currency] = useAutomaticCurrency();

    const subscriptionAge = differenceInDays(Date.now(), fromUnixTime(subscription?.PeriodStart ?? 0));

    const { update } = useFeature(FeatureCode.MailPaidUserNudgeTimestamp);

    const upsellRef = useMemo(
        () =>
            getUpsellRef({
                app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                component: UPSELL_COMPONENT.MODAL,
                feature: MAIL_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
            }),
        []
    );

    const handleSubscribed = () => {
        sendMailPlusPaidUsersNudgeReport({
            event: TelemetryPaidUsersNudge.userSubscribed,
            dimensions: { subscriptionAge },
        });

        // We set the flag to "hide offer" when the user subscribed so they don't see the offer again
        // if they take another monthly subscription in the future
        void update(HIDE_OFFER);
    };

    const { onUpgrade } = useUpsellConfig({
        ...upsellConfig,
        upsellRef,
        onSubscribed: handleSubscribed,
    });

    const [spotlightState, setSpotlightState] = useState(openSpotlight && !isLoading);
    const [isLastOfferDay, setIsLastOfferDay] = useState(false);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        const subscriptionAge = differenceInDays(Date.now(), fromUnixTime(subscription.PeriodStart));
        const isLastDay = isLastDayOfWindow(subscriptionAge);
        setIsLastOfferDay(isLastDay);
    }, [subscription]);

    const handleClick = () => {
        sendMailPlusPaidUsersNudgeReport({
            event: TelemetryPaidUsersNudge.clickUpsellButton,
            dimensions: { subscriptionAge },
        });

        if (onUpgrade) {
            onUpgrade();
        } else {
            openSubscriptionModal({
                ...upsellConfig,
                upsellRef,
                metrics: {
                    source: 'upsells',
                },
                onSubscribed: handleSubscribed,
            });
        }
    };

    const handleHideOffer = () => {
        sendMailPlusPaidUsersNudgeReport({
            event: TelemetryPaidUsersNudge.clickHideOffer,
            dimensions: { subscriptionAge },
        });

        createNotification({
            text: c('Offer').t`This offer won't be shown again.`,
        });

        setSpotlightState(false);
        void update(HIDE_OFFER);
    };

    if (loading || loadingSubscription || isLoading || prices.yearlyPrice === 0) {
        return null;
    }

    return (
        <SpotlightWithPromo
            borderRadius={isLastOfferDay ? 'md' : 'xl'}
            show={spotlightState}
            onPromoClick={() => {
                if (isLastOfferDay) {
                    handleClick();
                    setSpotlightState(false);
                } else {
                    sendMailPlusPaidUsersNudgeReport({
                        event: TelemetryPaidUsersNudge.clickTopNavbar,
                        dimensions: { subscriptionAge },
                    });

                    setSpotlightState((val) => !val);
                }
            }}
            promoIconName="light-lightbulb"
            promoColor="norm"
            promoChildren={
                <span className="color-primary">
                    {prices?.savedAmount ? (
                        <Price currency={currency} prefix={c('Offer').t`Save`} isDisplayedInSentence>
                            {prices.savedAmount}
                        </Price>
                    ) : (
                        c('Offer').t`Get the deal`
                    )}
                </span>
            }
            onClose={() => {
                setSpotlightState(false);
                sendMailPlusPaidUsersNudgeReport({
                    event: TelemetryPaidUsersNudge.closeOffer,
                    dimensions: { subscriptionAge },
                });
            }}
            promoLoading={loading || loadingSubscription || isLoading}
            innerClassName={isLastOfferDay ? undefined : 'p-0'}
            content={
                isLastOfferDay ? (
                    <NudgeOfferSpotlight imgSrc={mailOfferSpotlight} prices={prices} />
                ) : (
                    <NudgeOfferContent
                        imgSrc={mailOfferSpotlight}
                        onClick={handleClick}
                        prices={prices}
                        onNeverShow={handleHideOffer}
                    />
                )
            }
        />
    );
};
