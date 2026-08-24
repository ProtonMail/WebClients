import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import ModalTwoContent from '../../../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../../../components/modalTwo/ModalHeader';
import { InAppText, getSubscriptionManagerName } from '../../InAppPurchaseModal';

interface Props {
    subscription: Subscription;
    onClose: () => void;
}

export const ManagedExternallyContent = ({ subscription, onClose }: Props) => {
    const subscriptionManager = getSubscriptionManagerName(subscription.External);

    // translator: subscriptionManager currently can be "Google Play" or "Apple App Store"
    const title = c('Subscription change warning').t`Manage your subscription on ${subscriptionManager}`;

    return (
        <>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <InAppText subscription={subscription} />
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end">
                <Button color="norm" onClick={onClose} data-testid="ManagedExternallyContent/onClose">
                    {c('Subscription change warning').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
