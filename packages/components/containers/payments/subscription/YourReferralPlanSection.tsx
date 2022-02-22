import { ReactNode } from 'react';
import { c } from 'ttag';
import { format } from 'date-fns';
import { Button, ReferralFeaturesList } from '@proton/components';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import UnsubscribeButton from './UnsubscribeButton';
import { SUBSCRIPTION_STEPS } from './constants';

interface Props {
    expirationDate: number;
    mailAddons: ReactNode;
    onUpgrade: (plan: PLANS, step: SUBSCRIPTION_STEPS) => void;
}

const YourReferralPlanSection = ({ expirationDate, mailAddons, onUpgrade }: Props) => {
    const formattedTrialExpirationDate = format(expirationDate, 'MMMM d, y');
    const appName = getAppName(APPS.PROTONMAIL);
    const planName = PLAN_NAMES[PLANS.PLUS];

    return (
        <div className="flex flex-gap-1 on-tablet-flex-column">
            <div className="border px2 py1 w60">
                <h3>{c('Title').t`${appName} ${planName} Trial`}</h3>
                <p>{c('Info')
                    .t`Your free ${appName} ${planName} trial will end on ${formattedTrialExpirationDate}.`}</p>
                <p className="color-weak">
                    {c('Info')
                        .t`Continue with ${planName} today to avoid having access disabled at the end of your trial.`}{' '}
                </p>

                <ReferralFeaturesList />

                <div className="flex flex-justify-space-between">
                    <UnsubscribeButton>{c('Info').t`Cancel trial`}</UnsubscribeButton>
                    <Button color="norm" onClick={() => onUpgrade(PLANS.PLUS, SUBSCRIPTION_STEPS.CHECKOUT)}>{c('Info')
                        .t`Continue with ${planName}`}</Button>
                </div>
            </div>
            <div className="border px2 py1 flex-item-fluid">
                <h3>{c('Title').t`Your account’s usage`}</h3>
                <p>{c('Info').t`${planName} plan`}</p>
                {mailAddons}
            </div>
        </div>
    );
};

export default YourReferralPlanSection;
