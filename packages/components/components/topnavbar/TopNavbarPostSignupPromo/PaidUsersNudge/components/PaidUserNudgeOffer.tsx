import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useUpsellConfig, { appsWithInApp } from '@proton/components/components/upsell/useUpsellConfig';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { type FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { TelemetryPaidUsersNudge } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import { SpotlightWithPromo } from '../../common/SpotlightWithPromo';
import { HIDE_OFFER } from '../helpers/interface';
import type { SupportedPlans } from '../helpers/interface';
import { getPlanCopy, offerSpotlightImg, offerUpsellConfig, offerUpsellRef } from '../helpers/offerConfigHelpers';
import { getSubscriptionAge, isLastDayOfWindow } from '../helpers/paidUserNudgeHelper';
import { useGetPlanPriceWithCoupon } from '../hooks/useGetPlanPriceWithCoupon';
import { usePaidUsersNudgeTelemetry } from '../hooks/usePaidUsersNudgeTelemetry';
import { NudgeOfferContent } from './internal/NudgeOfferContent';
import { NudgeOfferPromoChild } from './internal/NudgeOfferPromoChild';
import { NudgeOfferSpotlight } from './internal/NudgeOfferSpotlight';

interface Props {
    currentPlan: SupportedPlans;
    offerTimestampFlag: FeatureCode;
    openSpotlight: boolean;
    isLoading: boolean;
}

export const PaidUserNudgeOffer = ({ currentPlan, offerTimestampFlag, openSpotlight, isLoading }: Props) => {
    const { APP_NAME } = useConfig();
    const { sendPaidUserNudgeReport } = usePaidUsersNudgeTelemetry({ plan: currentPlan });
    const { prices, loading } = useGetPlanPriceWithCoupon({ plan: currentPlan });

    const { createNotification } = useNotifications();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    const [user] = useUser();

    const goToSettings = useSettingsLink();

    const { update } = useFeature(offerTimestampFlag);

    const [spotlightState, setSpotlightState] = useState(openSpotlight && !isLoading);
    const [isLastOfferDay, setIsLastOfferDay] = useState(false);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        const isLastDay = isLastDayOfWindow(getSubscriptionAge(subscription));
        setIsLastOfferDay(isLastDay);
    }, [subscription]);

    const sendTelemetryEvent = (event: TelemetryPaidUsersNudge) => {
        sendPaidUserNudgeReport({
            event,
            dimensions: { subscriptionAge: getSubscriptionAge(subscription) },
        });
    };

    const handleSubscribed = () => {
        sendTelemetryEvent(TelemetryPaidUsersNudge.userSubscribed);
        void update(HIDE_OFFER);
    };

    const { onUpgrade } = useUpsellConfig({
        ...offerUpsellConfig[currentPlan],
        upsellRef: offerUpsellRef[currentPlan],
        onSubscribed: handleSubscribed,
    });

    const upsellInApp = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            openSubscriptionModal({
                ...offerUpsellConfig[currentPlan],
                upsellRef: offerUpsellRef[currentPlan],
                metrics: {
                    source: 'upsells',
                },
                onSubscribed: handleSubscribed,
            });
        }
    };

    const upsellInSettings = () => {
        goToSettings(
            addUpsellPath(
                getUpgradePath({
                    user,
                    subscription,
                    app: APP_NAME,
                    target: 'checkout',
                    ...offerUpsellConfig[currentPlan],
                }),
                offerUpsellRef[currentPlan]
            )
        );
    };

    const handleClick = () => {
        sendTelemetryEvent(TelemetryPaidUsersNudge.clickUpsellButton);
        if (appsWithInApp.has(APP_NAME) && APP_NAME !== APPS.PROTONACCOUNT) {
            upsellInApp();
        } else {
            upsellInSettings();
        }
    };

    const handleHideOffer = () => {
        sendTelemetryEvent(TelemetryPaidUsersNudge.clickHideOffer);

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
                    sendTelemetryEvent(TelemetryPaidUsersNudge.clickTopNavbar);
                    setSpotlightState((val) => !val);
                }
            }}
            promoIconName="light-lightbulb"
            promoColor="norm"
            promoChildren={
                <span className="color-primary">
                    <NudgeOfferPromoChild prices={prices} />
                </span>
            }
            onClose={() => {
                setSpotlightState(false);
                sendTelemetryEvent(TelemetryPaidUsersNudge.closeOffer);
            }}
            promoLoading={loading || loadingSubscription || isLoading}
            innerClassName={isLastOfferDay ? undefined : 'p-0'}
            content={
                isLastOfferDay ? (
                    <NudgeOfferSpotlight imgSrc={offerSpotlightImg[currentPlan]} prices={prices} />
                ) : (
                    <NudgeOfferContent
                        imgSrc={offerSpotlightImg[currentPlan]}
                        onClick={handleClick}
                        prices={prices}
                        onNeverShow={handleHideOffer}
                        planCopy={getPlanCopy(currentPlan)}
                    />
                )
            }
        />
    );
};
