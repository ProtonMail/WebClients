import { useEffect, useMemo, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { FeatureCode, useFeature } from '@proton/features';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, SECOND, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { useSubscriptionModal } from '../../../../../containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../../../containers/payments/subscription/constants';
import useActiveBreakpoint from '../../../../../hooks/useActiveBreakpoint';
import useSpotlightShow from '../../../../spotlight/useSpotlightShow';
import useUpsellConfig from '../../../../upsell/config/useUpsellConfig';
import { SpotlightWithPromo } from '../../common/SpotlightWithPromo';
import { usePostSignupOneDollarPromotionPrice } from '../components/usePostSignupOneDollarPromotionPrice';
import { EXTENDED_REMINDER_DAY, LAST_REMINDER_DAY, type PostSubscriptionOneDollarOfferState } from '../interface';
import { isStateTheSame, updatePostSignupOpenOfferState } from '../postSignupOffersHelpers';
import { MailPostSignupDollarContent } from './MailPostSignupOneDollarContent';
import { useMailPostSignupOneDollar } from './useMailPostSignupOneDollar';
import { useMailPostSignupOneDollarTelemetry } from './useMailPostSignupOneDollarTelemetry';

const getUpsellFeature = (daysSinceOffer: number) => {
    if (daysSinceOffer >= LAST_REMINDER_DAY) {
        return MAIL_UPSELL_PATHS.ONE_DOLLAR_LAST_REMINDER;
    }
    if (daysSinceOffer >= EXTENDED_REMINDER_DAY) {
        return MAIL_UPSELL_PATHS.ONE_DOLLAR_SECOND_REMINDER;
    }
    return MAIL_UPSELL_PATHS.ONE_DOLLAR_INITIAL_REMINDER;
};

export const MailPostSignupOneDollar = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const { openSpotlight } = useMailPostSignupOneDollar();

    const {
        sendReportClickTopNavbar,
        sendReportClickUpsellButton,
        sendReportCloseOffer,
        sendReportAutomaticModalOpen,
        sendReportUserSubscribed,
    } = useMailPostSignupOneDollarTelemetry();

    const [openSubscriptionModal] = useSubscriptionModal();

    const { feature: mailOfferState, update } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );

    const daysSinceOffer = differenceInDays(
        Date.now(),
        fromUnixTime(mailOfferState?.Value?.offerStartDate || Date.now())
    );

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
        coupon: COUPON_CODES.TRYMAILPLUS0724,
        cycle: CYCLE.MONTHLY,
        plan: PLANS.MAIL,
        onSubscribed: () => {
            sendReportUserSubscribed(daysSinceOffer);
        },
    });

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const show = useSpotlightShow(spotlightState, 3 * SECOND);

    const { pricingTitle } = usePostSignupOneDollarPromotionPrice({
        offerProduct: 'mail',
    });

    useEffect(() => {
        if (openSpotlight && mailOfferState) {
            sendReportAutomaticModalOpen(daysSinceOffer);
        }
    }, [mailOfferState?.Value]);

    // translators: do no go above 30 characters for this string
    const originalUpgradeText = c('specialoffer: Link').jt`Upgrade for ${pricingTitle}`;
    // translators: keep the "Special offer" text as short as possible since this is a fallback if the offer text is too long
    const upgradeText = originalUpgradeText[0].length > 30 ? c('Offer').t`Special offer` : originalUpgradeText;
    const upgradeIcon = upgradeText[0].length > 15 && viewportWidth['>=large'] ? undefined : IcUpgrade;

    const handleClose = () => {
        setSpotlightState(false);

        const newState = updatePostSignupOpenOfferState(mailOfferState?.Value);
        if (isStateTheSame(newState, mailOfferState?.Value)) {
            return;
        }

        void update(newState);
    };

    const handleUpsellClick = () => {
        handleClose();
        sendReportClickUpsellButton(daysSinceOffer);

        if (onUpgrade) {
            onUpgrade();
        } else {
            // Keep this as security measure even if `onUpgrade` should always be available
            openSubscriptionModal({
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                plan: PLANS.MAIL,
                cycle: CYCLE.MONTHLY,
                maximumCycle: CYCLE.YEARLY,
                coupon: COUPON_CODES.TRYMAILPLUS0724,
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
                if (daysSinceOffer >= LAST_REMINDER_DAY) {
                    handleUpsellClick();
                } else {
                    sendReportClickTopNavbar(daysSinceOffer);
                    setSpotlightState(true);
                }
            }}
            promoIcon={upgradeIcon}
            promoChildren={upgradeText}
            promoColor="full-gradient"
            spotlightBorderRadius={daysSinceOffer >= LAST_REMINDER_DAY ? 'md' : 'xl'}
            spotlightInnerClassName={daysSinceOffer >= LAST_REMINDER_DAY ? undefined : 'p-0'}
            spotlightShow={show || spotlightState}
            spotlightOnClose={handleClose}
            spotlightContent={
                <MailPostSignupDollarContent
                    pricingTitle={pricingTitle}
                    onClose={() => {
                        handleClose();
                        sendReportCloseOffer(daysSinceOffer);
                    }}
                    onUpsellClick={handleUpsellClick}
                    daysSinceOffer={daysSinceOffer}
                />
            }
        />
    );
};
