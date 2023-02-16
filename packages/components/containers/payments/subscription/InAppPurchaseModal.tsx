import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, Prompt } from '@proton/components/components';
import { External, Subscription } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    subscription: Subscription;
    adminPanelInfo?: {
        userId: number;
    };
    onClose: NonNullable<ModalProps['onClose']>;
}

const InAppPurchaseModal = ({ subscription, adminPanelInfo, ...rest }: Props) => {
    let subscriptionManager: string;
    let subscriptionManagerShort: string;
    if (subscription.External === External.Android) {
        subscriptionManager = 'Google Play store';
        subscriptionManagerShort = 'Google Play';
    } else if (subscription.External === External.iOS) {
        subscriptionManager = 'Apple App Store';
        subscriptionManagerShort = 'Apple App Store';
    } else {
        rest.onClose();
        return null;
    }

    // translator: subscriptionManager currently can be "Google Play store" or "Apple App Store"
    let userText = c('Subscription change warning')
        .t`Your subscription has been done via an in-app purchase. To manage your current subscription you need to navigate to the Subscription section on your ${subscriptionManager} account.`;

    if (adminPanelInfo) {
        userText = c('Subscription change warning')
            .t`Subscription of user ID-${adminPanelInfo.userId} has been done via an in-app purchase. To manage the subscription user needs to navigate to the Subscription section of their ${subscriptionManager} account.`;
    }

    return (
        <Prompt
            title={
                // translator: subscriptionManager currently can be "Google Play" or "Apple App Store"
                c('Subscription change warning').t`Manage your subscription on ${subscriptionManagerShort}`
            }
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
        </Prompt>
    );
};

export default InAppPurchaseModal;
