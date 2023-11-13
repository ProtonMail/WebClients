import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import { External, Subscription } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    subscription: Subscription;
    onClose: NonNullable<ModalProps['onClose']>;
}

function getSubscritionManagerName(externalCode: External.Android | External.iOS): string {
    if (externalCode === External.Android) {
        return 'Google Play';
    } else if (externalCode === External.iOS) {
        return 'Apple App Store';
    }

    return '';
}

export const InAppText = ({ subscription }: { subscription: Subscription }) => {
    const subscriptions = <span className="text-bold">{c('Subscription change warning').t`Subscriptions`}</span>;

    let firstLine: string;
    let secondLine: string | string[];
    if (subscription.External === External.Android) {
        firstLine = c('Subscription change warning')
            .t`Your plan was purchased using an Android app. So to make changes to your plan or update your payment details, you’ll need to go to the Google Play Store.`;
        secondLine = c('Subscription change warning')
            .jt`Just sign in to your Play Store account, then press ${subscriptions}.`;
    } else {
        firstLine = c('Subscription change warning')
            .t`Your plan was purchased using an iOS app. So to make changes to your plan or update your payment details, you’ll need to go to the Apple App Store.`;

        secondLine = c('Subscription change warning')
            .jt`Just sign in to your Apple App Store account, then press ${subscriptions}.`;
    }

    return (
        <>
            <p data-testid="InAppPurchaseModal/text">{firstLine}</p>
            <p className="mt-4">{secondLine}</p>
        </>
    );
};

const InAppPurchaseModal = ({ subscription, ...rest }: Props) => {
    if (subscription.External !== External.iOS && subscription.External !== External.Android) {
        rest.onClose();
        return null;
    }

    const subscriptionManager = getSubscritionManagerName(subscription.External);

    // translator: subscriptionManager currently can be "Google Play" or "Apple App Store"
    const title = c('Subscription change warning').t`Manage your subscription on ${subscriptionManager}`;

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={title}></ModalTwoHeader>
            <ModalTwoContent>
                <InAppText subscription={subscription} />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    className="mx-auto"
                    color="norm"
                    onClick={rest.onClose}
                    data-testid="InAppPurchaseModal/onClose"
                >
                    {c('Subscription change warning').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InAppPurchaseModal;
