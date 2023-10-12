import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    ErrorButton,
    type ModalSize,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';

export type ConfirmationModalProps = {
    onClose?: () => void;
    onSubmit?: () => any | Promise<any>;
    title?: string;
    children?: ReactNode;
    alertText?: ReactNode;
    cancelText?: ReactNode;
    submitText?: ReactNode;
    open?: boolean;
    disabled?: boolean;
    size?: ModalSize;
};

export const ConfirmationModal = ({
    alertText,
    cancelText = c('Action').t`Cancel`,
    submitText = c('Action').t`Submit`,
    disabled = false,
    title,
    children,
    open,
    size,
    onClose,
    onSubmit,
}: ConfirmationModalProps) => {
    const handleSubmit = async () => {
        await onSubmit?.();
        onClose?.();
    };

    return (
        <ModalTwo onClose={onClose} onReset={onClose} open={open} size={size ?? 'small'}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                {alertText && (
                    <Alert className="mb-4" type="error">
                        {alertText}
                    </Alert>
                )}

                {children}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose}>
                    {cancelText}
                </Button>
                <ErrorButton type="button" disabled={disabled} onClick={handleSubmit}>
                    {submitText}
                </ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
