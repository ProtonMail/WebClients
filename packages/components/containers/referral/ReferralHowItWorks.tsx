import { c } from 'ttag';
import { VerticalSteps, VerticalStep } from '@proton/atoms/VerticalSteps';

const ReferralHowItWorks = () => {
    return (
        <VerticalSteps>
            <VerticalStep
                icon="checkmark"
                title={c('info').t`Choose a username`}
                description={c('info').t`You successfully selected your new email address.`}
                status="passed"
            />
            <VerticalStep
                icon="lock"
                title={c('info').t`Today: get instant access`}
                description={c('info').t`15 GB secure mailbox with unlimited personalisation.`}
                status="done"
            />
            <VerticalStep
                icon="bell"
                title={c('info').t`Day 24: Trial end reminder`}
                description={c('info').t`We’ll send you a notice. Cancel anytime.`}
            />
            <VerticalStep
                icon="calendar-row"
                title={c('info').t`Day 30: Trial ends`}
                description={
                    <>
                        {c('info').t`Your subscription will start after your 30-day trial.`}
                        <br />
                        {c('info').t`Cancel anytime before`}
                    </>
                }
            />
        </VerticalSteps>
    );
};

export default ReferralHowItWorks;
