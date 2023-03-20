import React, { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    ErrorButton,
    ModalSize,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';

export interface ConfirmationModalProps {
    message: string;
    canUndo?: boolean;
    onCancel?: () => void;
    onSubmit?: () => Promise<void>;
    title?: string;
    children?: ReactNode;
    cancelText?: ReactNode;
    submitText?: ReactNode;
    loading?: boolean;
    className?: string;
    size?: ModalSize;
}

export const ConfirmationModal = ({
    cancelText = c('Action').t`Cancel`,
    submitText = c('Action').t`Submit`,
    loading,
    title,
    onClose,
    onCancel,
    onSubmit,
    size = 'large',
    open,
    message,
    canUndo = false,
}: ConfirmationModalProps & ModalStateProps) => {
    const [submitLoading, setSubmitLoading] = useState(false);

    const isLoading = loading || submitLoading;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            setSubmitLoading(true);
            await onSubmit();
            setSubmitLoading(false);
        }
        onClose();
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
                    {message}
                    <br />
                    {!canUndo && c('Info').t`You cannot undo this action.`}
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onCancel} disabled={isLoading}>
                    {cancelText}
                </Button>
                <ErrorButton type="submit" loading={isLoading}>
                    {submitText}
                </ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useConfirmModal = () => {
    return useModalTwo<ConfirmationModalProps, void>(ConfirmationModal, false);
};
