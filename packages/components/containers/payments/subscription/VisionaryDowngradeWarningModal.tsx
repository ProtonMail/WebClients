import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useConfig,
    useModalTwoPromise,
} from '@proton/components/index';
import { type FreeSubscription, type Subscription, getPlanTitle } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

const getVisionaryWarningTitle = () => {
    return c('Payments.ModificationWarning').t`Your plan includes this feature already.`;
};

const getVisionaryWarningText = (subscription: Subscription | FreeSubscription) => {
    const planTitle = getPlanTitle(subscription);

    return c('Payments.ModificationWarning')
        .t`If you choose to modify your ${planTitle} plan, you may lose access to some features.`;
};

export const getVisionaryDowngradeWarningTextElement = (subscription: Subscription | FreeSubscription) => {
    return (
        <>
            {getVisionaryWarningTitle()} {getVisionaryWarningText(subscription)}
        </>
    );
};

interface VisionaryModalProps extends ModalStateProps {
    onConfirm: () => void;
    subscription: Subscription | FreeSubscription;
}

export const VisionaryDowngradeWarningModal = ({ onConfirm, subscription, ...rest }: VisionaryModalProps) => {
    const planTitle = getPlanTitle(subscription);

    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoHeader title={getVisionaryWarningTitle()} hasClose={false} />
            <ModalTwoContent>
                <div>
                    {getVisionaryWarningText(subscription)}{' '}
                    {c('Payments.ModificationWarning').t`Are you sure you want to proceed?`}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onConfirm} className="w-full">{c('Payments.ModificationWarning')
                    .t`Yes, I'm sure`}</Button>
                <Button onClick={rest.onClose} color="norm" className="w-full">{c('Payments.ModificationWarning')
                    .t`Keep ${planTitle}`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useVisionaryDowngradeWarningModal = ({
    subscription,
}: {
    subscription: Subscription | FreeSubscription;
}) => {
    const { APP_NAME } = useConfig();

    const [visionaryDowngradeModalPromise, showVisionaryDowngradeModal] = useModalTwoPromise();
    const [renderVisionaryDowngradeWarningText, setRenderVisionaryDowngradeWarningText] = useState(false);

    const [modalWasPreviouslyActivated, setModalWasPreviouslyActivated] = useState(false);

    // resolves when user clicks "Yes, I'm sure", rejects when user presses any other button, or closes the modal
    // otherwise
    const visionaryDowngradeModal = visionaryDowngradeModalPromise(({ onResolve, onReject, ...props }) => (
        <VisionaryDowngradeWarningModal
            {...props}
            onConfirm={onResolve}
            onClose={onReject}
            subscription={subscription}
        />
    ));

    return {
        showVisionaryDowngradeWarning: async () => {
            if (APP_NAME === APPS.PROTONACCOUNTLITE) {
                setRenderVisionaryDowngradeWarningText(true);
                return;
            }
            if (modalWasPreviouslyActivated) {
                return;
            }
            setModalWasPreviouslyActivated(true);
            return showVisionaryDowngradeModal();
        },
        hideVisionaryDowngradeWarning: () => {
            setRenderVisionaryDowngradeWarningText(false);
        },
        visionaryDowngradeModal,
        renderVisionaryDowngradeWarningText,
    };
};
