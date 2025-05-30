import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { InlineLinkButton } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import TimeRemaining from '@proton/components/components/timeRemaining/TimeRemaining';
import { useIsB2BTrial } from '@proton/payments';

import CancelTrialModal from './CancelTrialModal';
import TopBanner from './TopBanner';

const TrialTopBanner = () => {
    const [closed, setClosed] = useState<boolean>(false);
    const [modalProps, setModal, renderModal] = useModalState();
    const location = useLocation();
    const [subscription] = useSubscription();
    const isB2BTrial = useIsB2BTrial(subscription);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('open') === 'cancel-trial') {
            setModal(true);
        }
    }, [location.search, setModal]);

    const trialEndsOn = subscription?.PeriodEnd;

    if (!isB2BTrial || !trialEndsOn || closed) {
        return null;
    }

    const trialEnded = isBefore(fromUnixTime(trialEndsOn), new Date());

    if (trialEnded) {
        return null;
    }

    const timeRemaining = <TimeRemaining expiry={trialEndsOn} />;
    const trialEndsOnFormatted = <Time>{trialEndsOn}</Time>;

    return (
        <>
            {renderModal && <CancelTrialModal {...modalProps} />}
            <TopBanner onClose={() => setClosed(true)} className="bg-info">
                <span className="mr-1">{c('Info').jt`Your trial will end in ${timeRemaining}.`}</span>
                <span className="mr-1">{c('Info')
                    .jt`You won't be charged if you cancel before ${trialEndsOnFormatted}.`}</span>
                <InlineLinkButton key="cancel-trial" onClick={() => setModal(true)}>
                    {c('Action').t`Cancel`}
                </InlineLinkButton>
            </TopBanner>
        </>
    );
};

export default TrialTopBanner;
