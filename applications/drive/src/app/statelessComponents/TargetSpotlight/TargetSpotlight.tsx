import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import { Portal } from '@proton/atoms/Portal/Portal';
import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { ModalContext } from '@proton/components/components/modalTwo/Modal';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import generateUID from '@proton/utils/generateUID';

import './TargetSpotlight.scss';

interface TargetSpotlightProps {
    target: HTMLElement;
    onClose: () => void;
    children: ReactNode;
    placement?: PopperPlacement;
}

/**
 * Backdrop over the whole page except a hole around `target`, with a dialog stuck next to it.
 * Children render inside `ModalContext`, so ModalContent / ModalFooter / ModalHeaderCloseButton work.
 */
export const TargetSpotlight = ({ target, onClose, children, placement = 'right-end' }: TargetSpotlightProps) => {
    const [id] = useState(() => generateUID('target-spotlight'));
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const { floating, position } = usePopper({
        isOpen: true,
        originalPlacement: placement,
        reference: { mode: 'element', value: target },
        offset: 22,
        availableSize: true,
    });
    const setDialog = (node: HTMLDialogElement | null) => {
        dialogRef.current = node;
        floating?.(node);
    };
    const focusTrapProps = useFocusTrap({ active: true, rootRef: dialogRef });

    useHotkeys(
        dialogRef,
        [
            [
                'Escape',
                (event) => {
                    event.stopPropagation();
                    onClose();
                },
            ],
        ],
        { dependencies: [onClose] }
    );

    // Target shown through the hole on a standard surface, clipped to the highlight shape (see .target-spotlight-target)
    useLayoutEffect(
        function highlightTarget() {
            const classNames = ['ui-standard', 'bg-norm', 'color-norm', 'rounded-none', 'target-spotlight-target'];
            target.classList.add(...classNames);
            return () => target.classList.remove(...classNames);
        },
        [target]
    );

    // Popper re-renders whenever the target moves or resizes --> hole follows it
    const targetRect = target.getBoundingClientRect();

    return (
        <Portal>
            <div className="fixed inset-0 z-modals">
                <div
                    className="target-spotlight-hole fixed pointer-events-none"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                />
                <dialog
                    ref={setDialog}
                    aria-modal="true"
                    aria-labelledby={id}
                    className="target-spotlight-dialog modal-two-dialog modal-two-dialog--xsmall outline-none"
                    style={position}
                    {...focusTrapProps}
                >
                    <ModalContext.Provider value={{ id, size: 'xsmall', onClose, open: true }}>
                        <div className="modal-two-dialog-container">{children}</div>
                    </ModalContext.Provider>
                </dialog>
            </div>
        </Portal>
    );
};
