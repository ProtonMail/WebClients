import React, { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ModalSize,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalTwo,
} from '@proton/components';

export interface ConfirmActionModalProps {
    message: string | ReactNode;
    canUndo?: boolean;
    actionType?: 'danger' | 'norm';
    onCancel?: () => void;
    onSubmit?: () => Promise<void | unknown>;
    title?: string;
    cancelText?: ReactNode;
    submitText?: ReactNode;
    loading?: boolean;
    className?: string;
    size?: ModalSize;
}

export const ConfirmActionModal = ({
    cancelText = c('Action').t`Cancel`,
    submitText = c('Action').t`Submit`,
    loading,
    title,
    onClose,
    onCancel,
    onSubmit,
    size = 'large',
    message,
    actionType = 'danger',
    canUndo = false,
    ...modalProps
}: ConfirmActionModalProps & ModalStateProps) => {
    const [submitLoading, setSubmitLoading] = useState(false);

    const isLoading = loading || submitLoading;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            setSubmitLoading(true);
            await onSubmit().catch(() => undefined);
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
            size={size}
            {...modalProps}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={title} />
            <ModalTwoContent>
                {message}
                <br />
                {!canUndo && c('Info').t`You cannot undo this action.`}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onCancel} disabled={isLoading}>
                    {cancelText}
                </Button>
                <Button type="submit" loading={isLoading} shape="solid" color={actionType}>
                    {submitText}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useConfirmActionModal = () => {
    return useModalTwo<ConfirmActionModalProps, void>(ConfirmActionModal, false);
};
