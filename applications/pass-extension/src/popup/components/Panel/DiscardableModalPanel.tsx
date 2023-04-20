import { type FC, type ReactNode, useCallback, useState } from 'react';

import { c } from 'ttag';

import type { Callback } from '@proton/pass/types';

import { ConfirmationModal } from '../../../shared/components/confirmation';
import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';

export type DiscardableModalRenderProps = { confirm: (effect?: Callback) => void; canFocus: boolean };
export type DiscardableModalProps = {
    discardable: boolean;
    onDiscard: () => void;
    children: (props: DiscardableModalRenderProps) => ReactNode;
};
export const DiscardableModalPanel: FC<DiscardableModalProps> = ({ discardable, onDiscard, children }) => {
    const [confirm, setConfirm] = useState<{ opened: boolean; effect?: Callback }>({ opened: false });
    const [canFocus, setCanFocus] = useState<boolean>(false);
    const doConfirm = useCallback((effect?: Callback) => setConfirm({ opened: true, effect }), []);
    const onBackdropClick = useCallback(discardable ? onDiscard : () => setConfirm({ opened: true }), [discardable]);

    return (
        <div>
            <SidebarModal
                open
                onBackdropClick={onBackdropClick}
                onEnter={() => setTimeout(() => setCanFocus(true), 250)}
                rootClassName="pass-modal-two--sidebar-content"
            >
                {children({ confirm: doConfirm, canFocus })}

                <ConfirmationModal
                    title={c('Title').t`Discard changes ?`}
                    open={confirm.opened}
                    onClose={() => setConfirm({ opened: false })}
                    onSubmit={confirm.effect ?? onDiscard}
                    submitText={c('Action').t`Discard`}
                >
                    {c('Warning').t`You have unsaved changes, are you sure you want to discard them?`}
                </ConfirmationModal>
            </SidebarModal>
        </div>
    );
};
