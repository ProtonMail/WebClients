import { c } from 'ttag';
import { format } from 'date-fns';
import { Button } from '@proton/components';
import { PLANS } from '@proton/shared/lib/constants';
import UnsubscribeButton from './UnsubscribeButton';
import useSubscriptionModal from './useSubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';
import { ReferralFeaturesList } from '../..';

interface Props {
    expirationDate: number;
    mailAddons: React.ReactNode;
}

const YourReferralPlanSection = ({ expirationDate, mailAddons }: Props) => {
    const formattedTrialExpirationDate = format(expirationDate, 'MMMM d, y');

    const [showSubscriptionModalCallback, loadingModal] = useSubscriptionModal();

    return (
        <div className="flex flex-gap-1 on-tablet-flex-column">
            <div className="border px2 py1 w60">
                <h3>{c('Title').t`ProtonMail Plus Trial`}</h3>
                <p>{c('Info').t`Your free ProtonMail Plus trial will end on ${formattedTrialExpirationDate}.`}</p>
                <p className="color-weak">
                    {c('Info').t`Continue with Plus today to avoid having access disabled at the end of your trial.`}{' '}
                </p>

                <ReferralFeaturesList />

                <div className="flex flex-justify-space-between">
                    <UnsubscribeButton>{c('Info').t`Cancel trial`}</UnsubscribeButton>
                    <Button
                        color="norm"
                        loading={loadingModal}
                        disabled={loadingModal}
                        onClick={() => showSubscriptionModalCallback(PLANS.PLUS, SUBSCRIPTION_STEPS.CHECKOUT)}
                    >{c('Info').t`Continue with plus`}</Button>
                </div>
            </div>
            <div className="border px2 py1 flex-item-fluid">
                <h3>{c('Title').t`Your account’s usage`}</h3>
                <p>{c('Info').t`Plus plan`}</p>
                {mailAddons}
            </div>
        </div>
    );
};

export default YourReferralPlanSection;
