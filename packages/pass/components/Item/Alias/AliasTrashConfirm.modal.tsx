import type { FC } from 'react';
import { type ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

export type AliasTrashConfirmModalProps = {
    onTrash: () => Promise<void>;
    onClose?: () => void;
    onDisable?: () => Promise<void>;
    children?: ReactNode;
    open?: boolean;
    title?: string;
};

export const AliasTrashConfirmModal: FC<AliasTrashConfirmModalProps> = ({
    onClose,
    onDisable,
    onTrash,
    children,
    open,
    title,
}) => {
    return (
        <PassModal onClose={onClose} onReset={onClose} enableCloseWhenClickOutside open={open} size="small">
            <ModalTwoHeader title={title ?? c('Warning').t`Trash alias ?`} />
            <ModalTwoContent>{children}</ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {onDisable ? (
                    <Button onClick={onDisable} size="large" color="norm" shape="solid">
                        {c('Action').t`Disable alias`}
                    </Button>
                ) : (
                    <Button onClick={onClose} size="large" color="weak" shape="solid">
                        {c('Action').t`Cancel`}
                    </Button>
                )}
                <Button onClick={onTrash} color={onDisable ? 'weak' : 'danger'} size="large" shape="solid">
                    {c('Action').t`Move to trash`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
