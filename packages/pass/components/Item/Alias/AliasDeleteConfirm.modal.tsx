import type { FC } from 'react';
import { type ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

type Props = {
    aliasEmail: string;
    canDisable: boolean;
    onClose: () => void;
    onDisable: (noRemind: boolean) => void;
    onDelete: (noRemind: boolean) => void;
    warning?: ReactNode;
};

export const AliasDeleteConfirmModal: FC<Props> = ({
    aliasEmail,
    canDisable,
    warning,
    onClose,
    onDisable,
    onDelete,
}) => (
    <PassModal onClose={onClose} onReset={onClose} enableCloseWhenClickOutside open size="xlarge">
        <ModalTwoHeader title={c('Warning').t`Delete ${aliasEmail}`} closeButtonProps={{ pill: true }} />
        <ModalTwoContent>
            {warning && (
                <Alert className="mb-4" type="error">
                    {warning}
                </Alert>
            )}
            <div className="mb-4">
                {canDisable
                    ? c('Info')
                          .jt`Please note once deleted, the alias can't be restored. Maybe you want to disable the alias instead?`
                    : c('Info')
                          .jt`Please note once deleted, the alias can't be restored. The alias is already disabled and won’t forward emails to your mailbox`}
            </div>
        </ModalTwoContent>
        <ModalTwoFooter className="flex justify-end gap-4">
            <Button color="weak" onClick={onClose} shape="solid" size="medium">
                {c('Action').t`Cancel`}
            </Button>
            {canDisable && (
                <Button color="norm" onClick={() => onDisable(false)} shape="solid" size="medium">
                    {c('Action').t`Disable alias`}
                </Button>
            )}

            <Button color="danger" onClick={() => onDelete} shape="outline" size="medium">
                {c('Action').t`Delete it, I will never need it`}
            </Button>
        </ModalTwoFooter>
    </PassModal>
);
