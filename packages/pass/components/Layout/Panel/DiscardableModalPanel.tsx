import { type FC, type ReactNode, useCallback, useState } from 'react';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import type { Callback } from '@proton/pass/types';

import { useEnsureMounted } from '../../../hooks/useEnsureMounted';
import { SidebarModal } from '../Modal/SidebarModal';

export type DiscardableModalRenderProps = { confirm: (effect?: Callback) => void; didEnter: boolean };
export type DiscardableModalProps = {
    discardable: boolean;
    onDiscard: () => void;
    children: (props: DiscardableModalRenderProps) => ReactNode;
};

/* The didMount state is passed as a render prop to the children so
 * that they are informed when the modal has appeared on the screen
 * and completed its reveal animation. This is particularly useful
 * when the children contain input elements that need to be autofocused
 * after the modal has finished appearing. By doing this, we can avoid
 * animation glitches related to the "flickering caret" problem that
 * can occur with CSS animations. The "flickering caret" problem refers
 * to the flickering effect that can happen when the input's text cursor
 * rapidly gains and loses focus, leading to visual inconsistencies. */
export const DiscardableModalPanel: FC<DiscardableModalProps> = ({ discardable, onDiscard, children }) => {
    const ensureMounted = useEnsureMounted();
    const [confirm, setConfirm] = useState<{ opened: boolean }>({ opened: false });

    const doConfirm = useCallback(() => setConfirm({ opened: true }), []);
    const onBackdropClick = useCallback(discardable ? onDiscard : () => setConfirm({ opened: true }), [discardable]);

    return (
        <div>
            <SidebarModal open onBackdropClick={onBackdropClick} rootClassName="pass-modal-two--sidebar-content">
                {(didEnter) => children({ confirm: doConfirm, didEnter })}
            </SidebarModal>

            <ConfirmationModal
                title={c('Title').t`Discard changes?`}
                open={confirm.opened}
                onClose={() => ensureMounted(setConfirm)({ opened: false }) /* view may have been unmounted */}
                onSubmit={onDiscard}
                alertText={c('Warning').t`You have unsaved changes.`}
                submitText={c('Action').t`Discard`}
            />
        </div>
    );
};
