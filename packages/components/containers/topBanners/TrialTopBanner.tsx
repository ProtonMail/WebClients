import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import TimeRemaining from '@proton/components/components/timeRemaining/TimeRemaining';
import useConfig from '@proton/components/hooks/useConfig';
import { Renew, isTrial } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import LearnMoreModal from './LearnMoreModal';
import TopBanner from './TopBanner';
import TrialCanceledModal from './TrialCanceledModal';
import { OPEN_TRIAL_CANCELED_MODAL } from './constants';
import LegacyReferralTopBanner from './trials/LegacyReferralTopBanner';
import ReferralTopBanner from './trials/ReferralTopBanner';

const B2BTrialTopBanner = () => {
    const [closed, setClosed] = useState<boolean>(false);
    const [modalProps, setModal, renderModal] = useModalState();
    const location = useLocation();
    const [subscription] = useSubscription();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('open') === 'cancel-trial') {
            setModal(true);
        }
    }, [location.search, setModal]);

    const trialEndsOn = subscription?.PeriodEnd;
    const trialCancelled = subscription?.Renew === Renew.Disabled;

    if (!trialEndsOn || closed || trialCancelled) {
        return null;
    }

    const trialEnded = isBefore(fromUnixTime(trialEndsOn), new Date());
    if (trialEnded) {
        return null;
    }

    const timeRemaining = <TimeRemaining expiry={trialEndsOn} key="eslint-autofix-3C8894" />;
    const trialEndsOnFormatted = <Time key="eslint-autofix-194343">{trialEndsOn}</Time>;

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

const TrialTopBanner = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const { APP_NAME } = useConfig();
    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const trial = isTrial(subscription);
    const isB2BTrial = useIsB2BTrial(subscription, organization);

    const isReferralExpansionEnabled = useFlag('ReferralExpansion');

    let topBanner = undefined;

    if (isB2BTrial) {
        topBanner = <B2BTrialTopBanner />;
    } else if (trial && isReferralExpansionEnabled) {
        topBanner = <ReferralTopBanner app={app} />;
    } else if (trial && !isVpn && app) {
        topBanner = <LegacyReferralTopBanner fromApp={app} />;
    }

    return <TrialCanceledModalWrapper>{topBanner}</TrialCanceledModalWrapper>;
};

export default TrialTopBanner;
