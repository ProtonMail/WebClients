import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Renew } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import useModalState from '../../components/modalTwo/useModalState';
import Time from '../../components/time/Time';
import TimeRemaining from '../../components/timeRemaining/TimeRemaining';
import useConfig from '../../hooks/useConfig';
import LearnMoreModal from './LearnMoreModal';
import TopBanner from './TopBanner';
import TrialCanceledModal from './TrialCanceledModal';
import { OPEN_TRIAL_CANCELED_MODAL } from './constants';
import LegacyReferralTopBanner from './trials/LegacyReferralTopBanner';
import ReferralTopBanner from './trials/ReferralTopBanner';

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

    const timeRemaining = <TimeRemaining expiry={trialEndsOn} key="trial-remaining" />;
    const trialEndsOnFormatted = <Time key="trial-end">{trialEndsOn}</Time>;

    return (
        <>
            {renderModal && <LearnMoreModal {...modalProps} />}
            <TopBanner onClose={() => setClosed(true)} className="bg-info">
                <span className="mr-1">{c('Info').jt`Your trial will end in ${timeRemaining}.`}</span>
                <span className="mr-1">{c('Info')
                    .jt`You won't be charged if you cancel before ${trialEndsOnFormatted}.`}</span>
                <InlineLinkButton key="cancel-trial" onClick={() => setModal(true)}>
                    {c('Action').t`Learn more`}
                </InlineLinkButton>
            </TopBanner>
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
