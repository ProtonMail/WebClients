import { useRef, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { FeatureCode, useFeature } from '@proton/features';
import { PLANS } from '@proton/payments/index';
import {
    APP_UPSELL_REF_PATH,
    COUPON_CODES,
    CYCLE,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import clsx from '@proton/utils/clsx';

import {
    EXTENDED_REMINDER_DAY,
    LAST_REMINDER_DAY,
    type PostSubscriptionOneDollarOfferState,
} from '../components/interface';
import { updatePostSignupOpenOfferState } from '../components/postSignupOffersHelpers';
import { usePostSignupOneDollarPromotionPrice } from '../components/usePostSignupOneDollarPromotionPrice';
import { MailPostSignupDollarContent } from './MailPostSignupOneDollarContent';
import { useMailPostSignupOneDollar } from './useMailPostSignupOneDollar';

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
    const buttonRef = useRef(null);

    const { viewportWidth } = useActiveBreakpoint();
    const { openSpotlight } = useMailPostSignupOneDollar();

    const [openSubscriptionModal] = useSubscriptionModal();

    const { feature: mailOfferState, update } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );

    const daysSinceOffer = differenceInDays(
        Date.now(),
        fromUnixTime(mailOfferState?.Value.offerStartDate || Date.now())
    );

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const show = useSpotlightShow(spotlightState, 3000);

    const { pricingTitle } = usePostSignupOneDollarPromotionPrice({
        offerProduct: 'mail',
    });

    const upgradeText = c('specialoffer: Link').jt`Upgrade for ${pricingTitle}`;
    const upgradeIcon = upgradeText.length > 15 && viewportWidth['>=large'] ? undefined : 'upgrade';

    const handleClose = () => {
        setSpotlightState(false);

        const newState = updatePostSignupOpenOfferState(mailOfferState?.Value);
        if (
            newState.automaticOfferReminders === mailOfferState?.Value.automaticOfferReminders &&
            newState.offerStartDate === mailOfferState.Value.offerStartDate
        ) {
            return;
        }

        void update(newState);
    };

    const handleUpsellClick = () => {
        handleClose();

        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: getUpsellFeature(daysSinceOffer),
        });

        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            plan: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            coupon: COUPON_CODES.TRYMAILPLUS0724,
            upsellRef,
            metrics: {
                source: 'upsells',
            },
        });
    };

    return (
        <Spotlight
            anchorRef={buttonRef}
            innerClassName={clsx(daysSinceOffer >= LAST_REMINDER_DAY ? undefined : 'p-0')}
            show={show || spotlightState}
            onClose={handleClose}
            content={
                <MailPostSignupDollarContent
                    pricingTitle={pricingTitle}
                    onClose={handleClose}
                    onUpsellClick={handleUpsellClick}
                    daysSinceOffer={daysSinceOffer}
                />
            }
        >
            <div ref={buttonRef}>
                <PromotionButton
                    as={ButtonLike}
                    className="flex items-center gap-2"
                    onClick={() => {
                        if (daysSinceOffer >= LAST_REMINDER_DAY) {
                            handleUpsellClick();
                        } else {
                            setSpotlightState(true);
                        }
                    }}
                    iconName={upgradeIcon}
                    size="medium"
                    fullGradient
                    responsive
                >
                    {upgradeText}
                </PromotionButton>
            </div>
        </Spotlight>
    );
};
