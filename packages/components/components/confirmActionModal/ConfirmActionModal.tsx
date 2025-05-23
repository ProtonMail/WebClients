import type { ReactNode } from 'react';
import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import type { HotkeyTuple } from '@proton/components/hooks/useHotkeys';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

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
    const handleSubmit = async () => {
        if (onSubmit) {
            setSubmitLoading(true);
            await onSubmit().finally(() => {
                setSubmitLoading(false);
                onClose();
            });
        } else {
            onClose();
        }
    };

    const onSubmitHotkeyPress = async (e: any) => {
        e.stopPropagation();
        // Irreversible actions do not benefit from the "confirm on enter"
        // feature to prevent accidental destructive actions
        if (canUndo) {
            await handleSubmit();
        }
    };

    const hotkeys: HotkeyTuple[] = [
        [KeyboardKey.Enter, onSubmitHotkeyPress],
        [KeyboardKey.Space, onSubmitHotkeyPress],
    ];

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onReset={onClose}
            onSubmit={async (e: React.FormEvent) => {
                e.preventDefault();
                await handleSubmit();
            }}
            size={size}
            hotkeys={hotkeys}
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
    return useModalTwoStatic(ConfirmActionModal);
};

export default ConfirmActionModal;
