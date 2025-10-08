import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { OpenCallbackProps } from '../../SubscriptionModalProvider';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';

interface Props {
    metricsSource: OpenCallbackProps['metrics']['source'];
}

export const GetMoreButton = ({ metricsSource }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();

    return (
        <Button
            color="norm"
            shape="outline"
            size="small"
            className="px-2"
            data-testid="get-more-btn"
            onClick={() =>
                openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    disablePlanSelection: true,
                    metrics: {
                        source: metricsSource,
                    },
                })
            }
        >
            {
                // translator: "Get more" means "Upgrade my business plan to get more user, more dedicated servers, etc"
                c('Action').t`Get more`
            }
        </Button>
    );
};
