import { ElementType, createContext, useLayoutEffect, useRef, useState } from 'react';
import { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

import useInstance from '@proton/hooks/useInstance';
import usePrevious from '@proton/hooks/usePrevious';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';

import { classnames, generateUID } from '../../helpers';
import { useHotkeys } from '../../hooks';
import Dialog from '../dialog/Dialog';
import { useFocusTrap } from '../focus';
import { Portal } from '../portal';
import { useModalPosition } from './modalPositions';

import './Modal.scss';

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge' | 'full';

/**
 * Omission of id from ModalOwnProps because in ModalOwnProps "id"
 * is optional, whereas in ModalContextValue it is guaranteed.
 * Same for size.
 */
type ModalContextValue = ModalOwnProps & { id: string; size: ModalSize };

export const ModalContext = createContext({} as ModalContextValue);

export interface ModalOwnProps {
    /**
     * Whether the modal is open or not.
     */
    open?: boolean;
    /**
     * Whether the modal should render behind the backdrop
     */
    behind?: boolean;
    size?: ModalSize;
    fullscreenOnMobile?: boolean;
    fullscreen?: boolean;
    /**
     * Disables closing the modal by pressing the 'Escape' key.
     */
    disableCloseOnEscape?: boolean;
    /**
     * Optional id to overwrite the internally generated id, which
     * is used for accessibility purposes (e.g.aria-labelledby & id
     * of the Title in ModalHeader)
     */
    id?: string;
    /**
     * Fires when the user clicks on the close button or when he
     * presses the escape key, unless 'disableCloseOnEscape' is
     * set to true.
     */
    onClose?: () => void;
    /**
     * Fires when the Modal has finished its exit animation.
     */
    onExit?: () => void;
}

enum ExitState {
    idle,
    exiting,
    exited,
}

const defaultElement = 'div';

export type ModalProps<E extends ElementType = typeof defaultElement> = PolymorphicPropsWithoutRef<ModalOwnProps, E>;

const Modal = <E extends ElementType = typeof defaultElement>({
    open,
    size = 'medium',
    fullscreenOnMobile,
    fullscreen,
    onClose,
    onExit,
    disableCloseOnEscape,
    className,
    behind,
    as,
    ...rest
}: PolymorphicPropsWithoutRef<ModalOwnProps, E>) => {
    const [exit, setExit] = useState(() => (open ? ExitState.idle : ExitState.exited));
    const id = useInstance(() => generateUID('modal'));
    const dialogRef = useRef(null);

    const active = exit !== ExitState.exited;
    const last = useModalPosition(active || false);

    const focusTrapProps = useFocusTrap({
        active,
        rootRef: dialogRef,
    });

    const modalContextValue: ModalContextValue = {
        id,
        open,
        size,
        onClose,
        disableCloseOnEscape,
    };

    const previousOpen = usePrevious(open);

    useLayoutEffect(() => {
        if (!previousOpen && open) {
            setExit(ExitState.idle);
        } else if (previousOpen && !open) {
            setExit(ExitState.exiting);
        }
    }, [previousOpen, open]);

    useHotkeys(
        dialogRef,
        [
            [
                'Escape',
                (e) => {
                    if (!active || disableCloseOnEscape) {
                        return;
                    }
                    e.stopPropagation();
                    onClose?.();
                },
            ],
        ],
        { dependencies: [active, disableCloseOnEscape] }
    );

    if (!active) {
        return null;
    }

    const exiting = exit === ExitState.exiting;
    const Element: ElementType = as || defaultElement;

    return (
        <Portal>
            <div
                className={classnames([
                    modalTwoRootClassName,
                    exiting && 'modal-two--out',
                    fullscreenOnMobile && 'modal-two--fullscreen-on-mobile',
                    fullscreen && 'modal-two--fullscreen',
                    (!last || behind) && 'modal-two--is-behind-backdrop',
                ])}
                onAnimationEnd={({ animationName }) => {
                    if (exiting && animationName === 'anime-modal-two-out') {
                        setExit(ExitState.exited);
                        onExit?.();
                    }
                }}
            >
                <Dialog
                    ref={dialogRef}
                    aria-labelledby={id}
                    aria-describedby={`${id}-description`}
                    {...focusTrapProps}
                    className={classnames([
                        'modal-two-dialog outline-none',
                        className,
                        size === 'small' && 'modal-two-dialog--small',
                        size === 'large' && 'modal-two-dialog--large',
                        size === 'xlarge' && 'modal-two-dialog--xlarge',
                        size === 'full' && 'modal-two-dialog--full',
                    ])}
                >
                    <ModalContext.Provider value={modalContextValue}>
                        <Element className="modal-two-dialog-container" {...rest} />
                    </ModalContext.Provider>
                </Dialog>
            </div>
        </Portal>
    );
};

export default Modal;
