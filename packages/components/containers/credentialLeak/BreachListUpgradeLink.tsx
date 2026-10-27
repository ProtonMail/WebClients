import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { useSubscriptionModal } from '../payments/subscription/SubscriptionModalProvider';

interface Props {
    total: number;
}

const BreachListUpgradeLink = ({ total }: Props) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const handleUpgradeClick = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            mode: 'upsell-modal',
        });
    };
    const numOfBreaches = total - 1;

    return (
        <div className="text-center color-weak">
            <span className="block text-md text-bold ">{c('Info').jt`Plus ${numOfBreaches} more`}</span>
            <Button
                onClick={handleUpgradeClick}
                loading={loadingSubscriptionModal}
                size="small"
                shape="underline"
                color="norm"
                data-testid="explore-other-plan"
            >{c('Action').t`Upgrade to view all`}</Button>
        </div>
    );
};

export default BreachListUpgradeLink;
