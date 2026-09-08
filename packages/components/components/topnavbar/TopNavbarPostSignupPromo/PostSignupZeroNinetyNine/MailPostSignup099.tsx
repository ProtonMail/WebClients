import { useEffect, useMemo, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { FeatureCode, useFeature } from '@proton/features';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, SECOND, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { useSubscriptionModal } from '../../../../containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../../containers/payments/subscription/constants';
import useActiveBreakpoint from '../../../../hooks/useActiveBreakpoint';
import useSpotlightShow from '../../../spotlight/useSpotlightShow';
import useUpsellConfig from '../../../upsell/config/useUpsellConfig';
import { SpotlightWithPromo } from '../common/SpotlightWithPromo';
import { MailPostSignup099Content } from './MailPostSignup099Content';
import {
    ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY,
    ZERO_NINETY_NINE_LAST_REMINDER_DAY,
    type ZeroNinetyNineOfferState,
} from './interface';
import { useMailPostSignup099 } from './useMailPostSignup099';
import { useMailPostSignup099Telemetry } from './useMailPostSignup099Telemetry';
import { useZeroNinetyNinePromotionPrice } from './useZeroNinetyNinePromotionPrice';
import { isZeroNinetyNineStateTheSame, updateZeroNinetyNineOfferState } from './zeroNinetyNineOfferState';

const getUpsellFeature = (daysSinceOffer: number) => {
    if (daysSinceOffer >= ZERO_NINETY_NINE_LAST_REMINDER_DAY) {
        return MAIL_UPSELL_PATHS.ZERO_NINETY_NINE_LAST_REMINDER;
    }
    if (daysSinceOffer >= ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY) {
        return MAIL_UPSELL_PATHS.ZERO_NINETY_NINE_SECOND_REMINDER;
    }
    return MAIL_UPSELL_PATHS.ZERO_NINETY_NINE_INITIAL_REMINDER;
};

export const MailPostSignup099 = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const { openSpotlight } = useMailPostSignup099();
    const { createNotification } = useNotifications();

    const {
        sendReportClickTopNavbar,
        sendReportClickUpsellButton,
        sendReportCloseOffer,
        sendReportClickHideOffer,
        sendReportAutomaticModalOpen,
        sendReportUserSubscribed,
    } = useMailPostSignup099Telemetry();

    const [openSubscriptionModal, loadingData] = useSubscriptionModal();

    const { feature: offerState, update } = useFeature<ZeroNinetyNineOfferState>(
        FeatureCode.MailPostSignupZeroNinetyNineState
    );
    const { update: updateHideOffer } = useFeature<boolean>(FeatureCode.HideMailPostSignupZeroNinetyNineOffer);

    const daysSinceOffer = differenceInDays(Date.now(), fromUnixTime(offerState?.Value?.offerStartDate || Date.now()));

    const upsellRef = useMemo(
        () =>
            getUpsellRef({
                app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                component: UPSELL_COMPONENT.MODAL,
                feature: getUpsellFeature(daysSinceOffer),
            }),
        [daysSinceOffer]
    );

    const { onUpgrade } = useUpsellConfig({
        upsellRef,
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        coupon: COUPON_CODES.TRYMAILPLUS0926,
        cycle: CYCLE.MONTHLY,
        plan: PLANS.MAIL,
        onSubscribed: () => {
            sendReportUserSubscribed(daysSinceOffer);
        },
    });

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const show = useSpotlightShow(spotlightState, 3 * SECOND);

    const { pricingTitle } = useZeroNinetyNinePromotionPrice({});

    useEffect(() => {
        if (openSpotlight && offerState) {
            sendReportAutomaticModalOpen(daysSinceOffer);
        }
    }, [offerState?.Value]);

    // translators: do no go above 30 characters for this string
    const originalUpgradeText = c('specialoffer: Link').jt`Upgrade for ${pricingTitle}`;
    // translators: keep the "Special offer" text as short as possible since this is a fallback if the offer text is too long
    const upgradeText = originalUpgradeText[0].length > 30 ? c('Offer').t`Special offer` : originalUpgradeText;
    const upgradeIcon = upgradeText[0].length > 15 && viewportWidth['>=large'] ? undefined : IcUpgrade;

    const handleClose = () => {
        setSpotlightState(false);

        const newState = updateZeroNinetyNineOfferState(offerState?.Value);
        if (isZeroNinetyNineStateTheSame(newState, offerState?.Value)) {
            return;
        }

        void update(newState);
    };

    const handleNeverShow = () => {
        sendReportClickHideOffer(daysSinceOffer);

        createNotification({
            text: c('Offer').t`This offer won't be shown again.`,
        });

        void updateHideOffer(true);

        handleClose();
    };

    const handleUpsellClick = () => {
        handleClose();
        sendReportClickUpsellButton(daysSinceOffer);

        if (onUpgrade) {
            void onUpgrade();
        } else {
            // Keep this as security measure even if `onUpgrade` should always be available
            void openSubscriptionModal({
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                plan: PLANS.MAIL,
                cycle: CYCLE.MONTHLY,
                maximumCycle: CYCLE.YEARLY,
                coupon: COUPON_CODES.TRYMAILPLUS0926,
                upsellRef,
                onSubscribed: () => {
                    sendReportUserSubscribed(daysSinceOffer);
                },
            });
        }
    };

    return (
        <SpotlightWithPromo
            promoOnClick={() => {
                if (daysSinceOffer >= ZERO_NINETY_NINE_LAST_REMINDER_DAY) {
                    handleUpsellClick();
                } else {
                    sendReportClickTopNavbar(daysSinceOffer);
                    setSpotlightState(true);
                }
            }}
            promoIcon={upgradeIcon}
            promoChildren={upgradeText}
            promoLoading={loadingData}
            promoColor="purple-blue-gradient"
            spotlightBorderRadius={daysSinceOffer >= ZERO_NINETY_NINE_LAST_REMINDER_DAY ? 'md' : 'xl'}
            spotlightInnerClassName={daysSinceOffer >= ZERO_NINETY_NINE_LAST_REMINDER_DAY ? undefined : 'p-0'}
            spotlightShow={show || spotlightState}
            spotlightOnClose={() => {
                handleClose();
                sendReportCloseOffer(daysSinceOffer);
            }}
            spotlightContent={
                <MailPostSignup099Content
                    pricingTitle={pricingTitle}
                    onUpsellClick={handleUpsellClick}
                    onNeverShow={handleNeverShow}
                    daysSinceOffer={daysSinceOffer}
                />
            }
        />
    );
};
