import { type ReactNode } from 'react';

import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import UpsellModalDescription from './components/UpsellModalDescription';
import UpsellModalUpgradeButton from './components/UpsellModalUpgradeButton';
import useUpsellModalConfig from './hooks/useUpsellModalConfig';

export interface UpsellModalProps {
    title: ReactNode;
    /** Image displayed above the title */
    illustration: string;
    modalProps: ModalStateProps;
    upsellRef?: string;
    /** Text displayed before the CTA */
    description?: ReactNode;
    /** Text displayed below the description */
    customDescription?: ReactNode;
    /** On CTA click, redirect to account page instead of opening payment modal */
    preventInAppPayment?: boolean;
    onClose?: () => void;
    /** Called when user subscription is completed */
    onSubscribed?: () => void;
    ['data-testid']?: string;
}

const UpsellModal = ({
    'data-testid': dataTestid,
    modalProps,
    title,
    description,
    customDescription,
    illustration,
    onClose,
    upsellRef,
    preventInAppPayment,
    onSubscribed,
}: UpsellModalProps) => {
    const config = useUpsellModalConfig({
        upsellRef,
        preventInAppPayment,
        onSubscribed,
    });

    const handleUpgrade = () => {
        config?.onUpgrade?.();
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    return (
        <ModalTwo {...modalProps} size="xsmall" data-testid={dataTestid} onClose={handleClose}>
            <ModalTwoContent unstyled>
                <div
                    className="relative flex justify-center items-center h-custom bg-lowered"
                    style={{ '--h-custom': '11rem' }}
                >
                    <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0 mt-3 mr-3' }} />
                    <img src={illustration} alt="" />
                </div>
                <div className="m-8 text-center">
                    <h1 className="text-lg text-bold">{title}</h1>
                    <UpsellModalDescription description={description} />
                    {config ? (
                        <UpsellModalUpgradeButton
                            closeModal={handleClose}
                            onClick={handleUpgrade}
                            path={config.upgradePath}
                            submitText={config.submitText}
                        />
                    ) : (
                        <Loader size="medium" className="color-primary" />
                    )}
                    {!!customDescription && <div className="my-6">{customDescription}</div>}
                    {!!config?.footerText && <p className="mt-2 m-0 text-sm color-weak">{config.footerText}</p>}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
