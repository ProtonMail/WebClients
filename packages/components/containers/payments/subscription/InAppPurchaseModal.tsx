import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { AlertModal, ModalProps } from '@proton/components/components';
import { External, Subscription } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    subscription: Subscription;
    onClose: NonNullable<ModalProps['onClose']>;
}

const InAppPurchaseModal = ({ subscription, ...rest }: Props) => {
    let subscriptionManager: string;
    if (subscription.External === External.Android) {
        subscriptionManager = 'Google Play store';
    } else if (subscription.External === External.iOS) {
        subscriptionManager = 'Apple App Store';
    } else {
        rest.onClose();
        return null;
    }

    // translator: subscriptionManager currently can be "Google Play store" or "Apple App Store"
    const userText = c('Subscription change warning')
        .t`Your subscription has been done via an in-app purchase. To manage your current subscription you need to navigate to the Subscription section on your ${subscriptionManager} account`;

    return (
        <AlertModal
            title={c('Subscription change warning').t`Subscription managed elsewhere`}
            buttons={[
                <Button
                    className="on-mobile-w100"
                    color="norm"
                    onClick={rest.onClose}
                    data-testid="InAppPurchaseModal/onClose"
                >
                    {c('Action').t`Close`}
                </Button>,
            ]}
            {...rest}
        >
            <p className="m0">{userText}</p>
        </AlertModal>
    );
};

export default InAppPurchaseModal;
