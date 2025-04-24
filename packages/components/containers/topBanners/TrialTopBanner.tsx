import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import Time from '@proton/components/components/time/Time';
import TimeRemaining from '@proton/components/components/timeRemaining/TimeRemaining';

import TopBanner from './TopBanner';

const TrialTopBanner = () => {
    const [subscription] = useSubscription();

    const trialEndsOn = subscription?.PeriodEnd;

    if (!subscription?.IsTrial || !trialEndsOn) {
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
            <TopBanner className="bg-info">
                <span className="mr-1">{c('Info').jt`Your trial will end in ${timeRemaining}.`}</span>
                {c('Info').jt`You won't be charged if you cancel before ${trialEndsOnFormatted}.`}
            </TopBanner>
        </>
    );
};

export default TrialTopBanner;
