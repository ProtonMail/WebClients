import { useState } from 'react';

import { fromUnixTime, isBefore } from 'date-fns';
import { c, msgid } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useDateCountdown from '@proton/hooks/useDateCountdown';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { DAY } from '@proton/shared/lib/constants';

import useModalState from '../../../components/modalTwo/useModalState';
import Time from '../../../components/time/Time';
import { useSubscriptionModalRaw } from '../../payments/subscription/subscriptionModalContext';
import TopBanner from '../../topBanners/TopBanner';
import PassSwitchToBasicConfirmModal from './PassSwitchToBasicConfirmModal';

const LAST_DAYS_THRESHOLD = 4;

const PassTrialTopBannerContent = ({
    trialEndsOn,
    onClose,
    onSubscribeClick,
    onDowngradeClick,
}: {
    trialEndsOn: number;
    onClose: () => void;
    onSubscribeClick: () => void;
    onDowngradeClick: () => void;
}) => {
    const { diff } = useDateCountdown(fromUnixTime(trialEndsOn));
    const daysRemaining = Math.round(diff / DAY); // same rounding logic as TimeRemaining component

    const subscribeLink = (
        <InlineLinkButton key="subscribe" className="color-inherit" onClick={onSubscribeClick}>
            {c('Action').t`Subscribe`}
        </InlineLinkButton>
    );

    if (daysRemaining <= LAST_DAYS_THRESHOLD) {
        const downgradeLink = (
            <InlineLinkButton key="downgrade" className="color-inherit" onClick={onDowngradeClick}>
                {c('Action').t`downgrade to ${PLAN_NAMES[PLANS.PASS_BASIC]}`}
            </InlineLinkButton>
        );

        return (
            <TopBanner onClose={onClose} className="bg-danger">
                {c('Info')
                    .jt`Your access will soon get restricted. ${subscribeLink} to keep ${PLAN_NAMES[PLANS.PASS_BUSINESS]} benefits or ${downgradeLink}.`}
            </TopBanner>
        );
    }

    const daysRemainingText = c('Info').ngettext(msgid`${daysRemaining} day`, `${daysRemaining} days`, daysRemaining);
    const trialEndsOnFormatted = <Time key="trial-end-date">{trialEndsOn}</Time>;

    return (
        <TopBanner onClose={onClose} className="bg-warning">
            {c('Info')
                .jt`Your free trial will end in ${daysRemainingText}. ${subscribeLink} before ${trialEndsOnFormatted} to keep your ${PLAN_NAMES[PLANS.PASS_BUSINESS]} benefits.`}
        </TopBanner>
    );
};

/** Banner for the auto-assigned Pass Professional trial: subscribe, or downgrade to Pass Basic near the end */
const PassTrialTopBanner = ({ subscription }: { subscription: Subscription }) => {
    const [closed, setClosed] = useState(false);
    const [switchToBasicModalProps, setSwitchToBasicModalOpen, renderSwitchToBasicModal] = useModalState();
    const openSubscriptionModal = useSubscriptionModalRaw();

    const trialEndsOn = subscription.PeriodEnd;
    if (!trialEndsOn || closed || isBefore(fromUnixTime(trialEndsOn), new Date())) {
        return null;
    }

    return (
        <>
            {renderSwitchToBasicModal && <PassSwitchToBasicConfirmModal {...switchToBasicModalProps} />}
            <PassTrialTopBannerContent
                trialEndsOn={trialEndsOn}
                onClose={() => setClosed(true)}
                onSubscribeClick={() => {
                    void openSubscriptionModal({
                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                        disablePlanSelection: true,
                    });
                }}
                onDowngradeClick={() => setSwitchToBasicModalOpen(true)}
            />
        </>
    );
};

export default PassTrialTopBanner;
