import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useDateCountdown } from '@proton/hooks';
import { Renew } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DAY } from '@proton/shared/lib/constants';

import SettingsLink from '../../components/link/SettingsLink';
import useModalState from '../../components/modalTwo/useModalState';
import Time from '../../components/time/Time';
import TimeRemaining from '../../components/timeRemaining/TimeRemaining';
import LearnMoreModal from './LearnMoreModal';
import TopBanner from './TopBanner';
import TrialCanceledModal from './TrialCanceledModal';
import { OPEN_TRIAL_CANCELED_MODAL } from './constants';
import LegacyReferralTopBanner from './trials/LegacyReferralTopBanner';
import ReferralTopBanner from './trials/ReferralTopBanner';

const WARNING_CARDLESS_TRIAL_THRESHOLD_DAYS = 7;
const DANGER_CARDLESS_TRIAL_THRESHOLD_DAYS = 3;

interface B2BTrialBannerProps {
    trialEndsOn: number;
    timeRemaining: ReactNode;
    onClose: () => void;
    onLearnMore: () => void;
}

const LearnMoreLink = ({ onLearnMore }: { onLearnMore: () => void }) => (
    <InlineLinkButton onClick={onLearnMore}>{c('Action').t`Learn more`}</InlineLinkButton>
);

const CardlessTopBanner = ({ trialEndsOn, timeRemaining, onClose, onLearnMore }: B2BTrialBannerProps) => {
    const addPaymentMethodLink = (
        <SettingsLink key="add-payment-method" className="color-inherit" path="/dashboard#payment-methods">
            {c('Action').t`Add a payment method`}
        </SettingsLink>
    );
    const learnMoreLink = <LearnMoreLink key="learn-more" onLearnMore={onLearnMore} />;
    const { diff } = useDateCountdown(fromUnixTime(trialEndsOn));
    const daysRemaining = Math.round(diff / DAY); // same rounding logic as TimeRemaining component

    if (daysRemaining <= DANGER_CARDLESS_TRIAL_THRESHOLD_DAYS) {
        return (
            <TopBanner onClose={onClose} className="bg-danger">
                {c('Info')
                    .jt`${timeRemaining} left in your trial. ${addPaymentMethodLink} to avoid losing access. ${learnMoreLink}`}
            </TopBanner>
        );
    }

    const className = daysRemaining <= WARNING_CARDLESS_TRIAL_THRESHOLD_DAYS ? 'bg-warning' : 'bg-info';

    return (
        <TopBanner onClose={onClose} className={className}>
            {c('Info')
                .jt`${timeRemaining} left in your trial. ${addPaymentMethodLink} to keep your subscription. ${learnMoreLink}`}
        </TopBanner>
    );
};

const CardfulTopBanner = ({ trialEndsOn, timeRemaining, onClose, onLearnMore }: B2BTrialBannerProps) => {
    const trialEndsOnFormatted = <Time key="trial-end">{trialEndsOn}</Time>;

    return (
        <TopBanner onClose={onClose} className="bg-info">
            <span className="mr-1">{c('Info').jt`Your trial will end in ${timeRemaining}.`}</span>
            <span className="mr-1">{c('Info')
                .jt`You won't be charged if you cancel before ${trialEndsOnFormatted}.`}</span>
            <LearnMoreLink onLearnMore={onLearnMore} />
        </TopBanner>
    );
};

const B2BTrialBanner = ({ trialEndsOn, onClose, onLearnMore, timeRemaining }: B2BTrialBannerProps) => {
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();

    if (loadingPaymentMethods) {
        return null;
    }

    const B2BTrialBannerVariant = paymentMethods?.length ? CardfulTopBanner : CardlessTopBanner;

    return (
        <B2BTrialBannerVariant
            trialEndsOn={trialEndsOn}
            timeRemaining={timeRemaining}
            onClose={onClose}
            onLearnMore={onLearnMore}
        />
    );
};

const B2BTrialTopBanner = ({ subscription }: { subscription: Subscription }) => {
    const [closed, setClosed] = useState<boolean>(false);
    const [modalProps, setModal, renderModal] = useModalState();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('open') === 'cancel-trial') {
            setModal(true);
        }
    }, [location.search, setModal]);

    const trialEndsOn = subscription?.PeriodEnd;
    const trialCancelled = isPaidSubscription(subscription) && subscription.Renew === Renew.Disabled;

    if (!trialEndsOn || closed || trialCancelled) {
        return null;
    }

    const trialEnded = isBefore(fromUnixTime(trialEndsOn), new Date());
    if (trialEnded) {
        return null;
    }

    return (
        <>
            {renderModal && <LearnMoreModal {...modalProps} />}
            <B2BTrialBanner
                trialEndsOn={trialEndsOn}
                timeRemaining={<TimeRemaining expiry={trialEndsOn} key="trial-remaining" />}
                onClose={() => setClosed(true)}
                onLearnMore={() => setModal(true)}
            />
        </>
    );
};

const TrialCanceledModalWrapper = ({ children }: { children?: ReactNode }): ReactNode => {
    const [canceledModalProps, setCanceledModalOpen, renderCanceledModal] = useModalState();

    useEffect(() => {
        const open = () => {
            setCanceledModalOpen(true);
        };
        document.addEventListener(OPEN_TRIAL_CANCELED_MODAL, open);
        return () => {
            document.removeEventListener(OPEN_TRIAL_CANCELED_MODAL, open);
        };
    }, []);

    return (
        <>
            {renderCanceledModal && <TrialCanceledModal {...canceledModalProps} />}
            {children}
        </>
    );
};

const TrialTopBannerPerSubscription = ({ app, subscription }: { app: APP_NAMES; subscription: Subscription }) => {
    const { APP_NAME } = useConfig();
    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const trialInfo = getTrialInfoForSingleSubscription(subscription);

    let topBanner = undefined;
    if (trialInfo.isB2BTrial) {
        topBanner = <B2BTrialTopBanner subscription={subscription} />;
    } else if (trialInfo.isReferralTrial) {
        topBanner = <ReferralTopBanner app={app} subscription={subscription} />;
    } else if (trialInfo.isTrial && !isVpn && app) {
        topBanner = <LegacyReferralTopBanner fromApp={app} subscription={subscription} />;
    }

    return <TrialCanceledModalWrapper>{topBanner}</TrialCanceledModalWrapper>;
};

const TrialTopBanner = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();

    if (!isPaidSubscription(subscription)) {
        return null;
    }

    return <TrialTopBannerPerSubscription app={app} subscription={subscription} />;
};

export default TrialTopBanner;
