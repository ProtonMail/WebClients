import { type ReactNode } from 'react';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

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

const UpgradeButton = ({
    path,
    onClick,
    submitText,
    closeModal,
}: {
    closeModal: () => void;
    onClick: () => void;
    path?: string;
    submitText?: ReactNode | ((closeModal: () => void) => ReactNode);
}) => {
    if (typeof submitText === 'function') {
        return submitText(closeModal);
    }

    if (path) {
        return (
            <ButtonLike
                as={SettingsLink}
                color="norm"
                fullWidth
                onClick={onClick}
                path={path}
                shape="solid"
                size="medium"
            >
                {submitText}
            </ButtonLike>
        );
    }

    return (
        <Button color="norm" fullWidth size="medium" shape="solid" onClick={onClick}>
            {submitText}
        </Button>
    );
};

const Description = ({ description }: { description: ReactNode }) => {
    if (!description) {
        return null;
    }

    if (typeof description === 'string') {
        return <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>;
    }

    return <div className="mt-2 mb-6 color-weak">{description}</div>;
};

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
                    className="relative flex justify-center items-center h-custom custom-bg"
                    style={{ '--h-custom': '11rem', '--custom-bg': 'var(--optional-background-lowered)' }}
                >
                    <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0 mt-3 mr-3' }} />
                    <img src={illustration} alt="" />
                </div>
                <div className="m-8 text-center">
                    <h1 className="text-lg text-bold">{title}</h1>
                    <Description description={description} />
                    {config ? (
                        <UpgradeButton
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
