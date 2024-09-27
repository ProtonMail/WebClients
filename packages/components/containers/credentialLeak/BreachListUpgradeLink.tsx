import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';

interface Props {
    total: number;
}

const BreachListUpgradeLink = ({ total }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const metrics = {
        source: 'plans',
    } as const;

    const handleUpgradeClick = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
            mode: 'upsell-modal',
        });
    };
    const numOfBreaches = total - 1;

    return (
        <div className="text-center color-weak">
            <span className="block text-md text-bold ">{c('Info').jt`Plus ${numOfBreaches} more`}</span>
            <Button
                onClick={handleUpgradeClick}
                size="small"
                shape="underline"
                color="norm"
                data-testid="explore-other-plan"
            >{c('Action').t`Upgrade to view all`}</Button>
        </div>
    );
};

export default BreachListUpgradeLink;
