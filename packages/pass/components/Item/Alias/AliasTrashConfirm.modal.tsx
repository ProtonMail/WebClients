import type { FC } from 'react';
import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

type Props = {
    canDisable: boolean;
    warning?: ReactNode;
    onClose?: () => void;
    onDisable?: (noRemind: boolean) => void;
    onTrash: (noRemind: boolean) => void;
};

export const AliasTrashConfirmModal: FC<Props> = ({ canDisable, warning, onClose, onDisable, onTrash }) => {
    const [noRemind, setNoRemind] = useState(false);

    return (
        <PassModal onClose={onClose} onReset={onClose} enableCloseWhenClickOutside open size="small">
            <ModalTwoHeader title={c('Warning').t`Move to trash`} closeButtonProps={{ pill: true }} />
            <ModalTwoContent>
                {warning && (
                    <Alert className="mb-4" type="error">
                        {warning}
                    </Alert>
                )}

                {canDisable && (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .t`Aliases in trash will continue forwarding emails. If you want to stop receiving emails on this address, disable it instead.`}
                        </div>
                        <Checkbox
                            className="gap-0"
                            checked={noRemind}
                            onChange={({ target }) => setNoRemind(target.checked)}
                        >
                            {c('Label').t`Don't remind me again`}
                        </Checkbox>
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <Button
                    color={canDisable ? 'norm' : 'weak'}
                    onClick={canDisable ? () => onDisable?.(noRemind) : onClose}
                    shape="solid"
                    size="large"
                >
                    {canDisable ? c('Action').t`Disable instead` : c('Action').t`Cancel`}
                </Button>

                <Button
                    color={canDisable ? 'weak' : 'danger'}
                    onClick={() => onTrash(noRemind)}
                    shape="outline"
                    size="large"
                >
                    {c('Action').t`Move to trash`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
