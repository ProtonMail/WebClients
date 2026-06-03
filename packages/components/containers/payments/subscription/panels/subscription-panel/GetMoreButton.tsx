import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';

export const GetMoreButton = () => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    return (
        <Button
            color="norm"
            shape="outline"
            size="small"
            className="px-2"
            data-testid="get-more-btn"
            loading={loadingSubscriptionModal}
            onClick={() => {
                void openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    disablePlanSelection: true,
                });
            }}
        >
            {
                // translator: "Get more" means "Upgrade my business plan to get more user, more dedicated servers, etc"
                c('Action').t`Get more`
            }
        </Button>
    );
};
