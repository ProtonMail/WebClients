import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useUpsellConfig from '@proton/components/components/upsell/hooks/useUpsellConfig';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import useFeature from '@proton/features/useFeature';
import { TelemetryPaidUsersNudge } from '@proton/shared/lib/api/telemetry';
import { APPS, APPS_WITH_IN_APP_PAYMENTS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import { SpotlightWithPromo } from '../../common/SpotlightWithPromo';
import { HIDE_OFFER } from '../helpers/interface';
import { defaultOfferUpsellConfig, getPlanCopy } from '../helpers/offerConfigHelpers';
import { getSubscriptionAge, isLastDayOfWindow } from '../helpers/paidUserNudgeHelper';
import { useGetPlanPriceWithCoupon } from '../hooks/useGetPlanPriceWithCoupon';
import { usePaidUsersNudgeTelemetry } from '../hooks/usePaidUsersNudgeTelemetry';
import type { PaidUserConfig } from '../montlyPaidUserNudgeConfig';
import { NudgeOfferContent } from './internal/NudgeOfferContent';
import { NudgeOfferPromoChild } from './internal/NudgeOfferPromoChild';
import { NudgeOfferSpotlight } from './internal/NudgeOfferSpotlight';

interface Props {
    offerConfig: PaidUserConfig;
    openSpotlight: boolean;
    isLoading: boolean;
}

export const PaidUserNudgeOffer = ({ offerConfig, openSpotlight, isLoading }: Props) => {
    const { APP_NAME } = useConfig();
    const { sendPaidUserNudgeReport } = usePaidUsersNudgeTelemetry({ plan: offerConfig.currentPlan });
    const { prices, loading } = useGetPlanPriceWithCoupon({ plan: offerConfig.currentPlan });

    const { createNotification } = useNotifications();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    const [user] = useUser();

    const goToSettings = useSettingsLink();

    const { update } = useFeature(offerConfig.offerTimestampFlag);

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
        ...defaultOfferUpsellConfig,
        plan: offerConfig.currentPlan,
        upsellRef: offerConfig.upsellRef,
        onSubscribed: handleSubscribed,
    });

    const upsellInApp = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            openSubscriptionModal({
                ...defaultOfferUpsellConfig,
                plan: offerConfig.currentPlan,
                upsellRef: offerConfig.upsellRef,
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
                    ...defaultOfferUpsellConfig,
                    plan: offerConfig.currentPlan,
                }),
                offerConfig.upsellRef
            )
        );
    };

    const handleClick = () => {
        sendTelemetryEvent(TelemetryPaidUsersNudge.clickUpsellButton);
        if (APPS_WITH_IN_APP_PAYMENTS.has(APP_NAME) && APP_NAME !== APPS.PROTONACCOUNT) {
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
            promoOnClick={() => {
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
            spotlightBorderRadius={isLastOfferDay ? 'md' : 'xl'}
            spotlightShow={spotlightState}
            spotlightOnClose={() => {
                setSpotlightState(false);
                sendTelemetryEvent(TelemetryPaidUsersNudge.closeOffer);
            }}
            promoLoading={loading || loadingSubscription || isLoading}
            spotlightInnerClassName={isLastOfferDay ? undefined : 'p-0'}
            spotlightContent={
                isLastOfferDay ? (
                    <NudgeOfferSpotlight imgSrc={offerConfig.spotlightImage} prices={prices} />
                ) : (
                    <NudgeOfferContent
                        imgSrc={offerConfig.spotlightImage}
                        onClick={handleClick}
                        prices={prices}
                        onNeverShow={handleHideOffer}
                        planCopy={getPlanCopy(offerConfig.currentPlan)}
                    />
                )
            }
        />
    );
};
