import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ErrorButton, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

export type ConfirmationModalProps = {
    onClose?: () => void;
    onSubmit?: () => void;
    title?: string;
    children?: ReactNode;
    cancelText?: ReactNode;
    submitText?: ReactNode;
    open?: boolean;
};

export const ConfirmationModal = ({
    cancelText = c('Action').t`Cancel`,
    submitText = c('Action').t`Submit`,
    title,
    children,
    open,
    onClose,
    onSubmit,
}: ConfirmationModalProps) => {
    const handleSubmit = async () => {
        onSubmit?.();
        onClose?.();
    };

    return (
        <ModalTwo onClose={onClose} onReset={onClose} open={open} size="small">
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Alert className="mb1" type="error">
                    {children}
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose}>
                    {cancelText}
                </Button>
                <ErrorButton type="button" onClick={handleSubmit}>
                    {submitText}
                </ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
