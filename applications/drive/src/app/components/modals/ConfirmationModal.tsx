import { c } from 'ttag';
import React, { ReactNode, useState } from 'react';

import {
    Alert,
    Button,
    ErrorButton,
    ModalSize,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';

export interface ConfirmationModalProps {
    onClose?: () => void;
    onSubmit?: () => Promise<void>;
    title?: string;
    children?: ReactNode;
    cancelText?: ReactNode;
    submitText?: ReactNode;
    loading?: boolean;
    className?: string;
    size?: ModalSize;
    open?: boolean;
}

export const ConfirmationModal = ({
    cancelText = c('Action').t`Cancel`,
    submitText = c('Action').t`Submit`,
    loading,
    title,
    onClose,
    onSubmit,
    size = 'large',
    children,
    open,
}: ConfirmationModalProps) => {
    const [submitLoading, setSubmitLoading] = useState(false);

    const isLoading = loading || submitLoading;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            setSubmitLoading(true);
            await onSubmit();
            setSubmitLoading(false);
        }
        onClose?.();
    };

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onReset={onClose}
            onSubmit={handleSubmit}
            open={open}
            size={size}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={title} />
            <ModalTwoContent>
                <Alert className="mb1" type="error">
                    {children}
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </Button>
                <ErrorButton type="submit" loading={isLoading}>
                    {submitText}
                </ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
