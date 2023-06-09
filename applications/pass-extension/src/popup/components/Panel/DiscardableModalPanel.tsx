import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { Callback } from '@proton/pass/types';

import { ConfirmationModal } from '../../../shared/components/confirmation';
import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';

export type DiscardableModalRenderProps = { confirm: (effect?: Callback) => void; didMount: boolean };
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
    const timer = useRef<NodeJS.Timeout>();
    const [confirm, setConfirm] = useState<{ opened: boolean; effect?: Callback }>({ opened: false });
    const [didMount, setDidMount] = useState<boolean>(false);
    const doConfirm = useCallback((effect?: Callback) => setConfirm({ opened: true, effect }), []);
    const onBackdropClick = useCallback(discardable ? onDiscard : () => setConfirm({ opened: true }), [discardable]);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <div>
            <SidebarModal
                open
                onBackdropClick={onBackdropClick}
                onEnter={() => (timer.current = setTimeout(() => setDidMount(true), 50))}
                rootClassName="pass-modal-two--sidebar-content"
            >
                {children({ confirm: doConfirm, didMount })}

                <ConfirmationModal
                    title={c('Title').t`Discard changes ?`}
                    open={confirm.opened}
                    onClose={() => setConfirm({ opened: false })}
                    onSubmit={confirm.effect ?? onDiscard}
                    alertText={c('Warning').t`You have unsaved changes, are you sure you want to discard them?`}
                    submitText={c('Action').t`Discard`}
                />
            </SidebarModal>
        </div>
    );
};
