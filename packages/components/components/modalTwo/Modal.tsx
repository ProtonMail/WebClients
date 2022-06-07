import { ElementType, createContext, useLayoutEffect, useState, useRef } from 'react';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';

import { usePrevious, useHotkeys, useInstance } from '../../hooks';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { classnames, generateUID } from '../../helpers';
import { useFocusTrap } from '../focus';
import { Portal } from '../portal';
import './Modal.scss';
import { useModalPosition } from './modalPositions';

export type ModalSize = 'small' | 'medium' | 'large' | 'full';

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

export type ModalProps<E extends ElementType = typeof defaultElement> = PolymorphicComponentProps<E, ModalOwnProps>;

const Modal = <E extends ElementType = typeof defaultElement>({
    open,
    size = 'medium',
    fullscreenOnMobile,
    fullscreen,
    onClose,
    onExit,
    disableCloseOnEscape,
    className,
    ...rest
}: PolymorphicComponentProps<E, ModalOwnProps>) => {
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

    return (
        <Portal>
            <div
                className={classnames([
                    modalTwoRootClassName,
                    exiting && 'modal-two--out',
                    fullscreenOnMobile && 'modal-two--fullscreen-on-mobile',
                    fullscreen && 'modal-two--fullscreen',
                    !last && 'modal-two--is-behind-backdrop',
                ])}
                onAnimationEnd={({ animationName }) => {
                    if (exiting && animationName === 'anime-modal-two-out') {
                        setExit(ExitState.exited);
                        onExit?.();
                    }
                }}
            >
                <dialog
                    ref={dialogRef}
                    aria-labelledby={id}
                    aria-describedby={`${id}-description`}
                    {...focusTrapProps}
                    className={classnames([
                        'modal-two-dialog outline-none',
                        className,
                        size === 'small' && 'modal-two-dialog--small',
                        size === 'large' && 'modal-two-dialog--large',
                        size === 'full' && 'modal-two-dialog--full',
                    ])}
                >
                    <ModalContext.Provider value={modalContextValue}>
                        <Box as={defaultElement} className="modal-two-dialog-container" {...rest} />
                    </ModalContext.Provider>
                </dialog>
            </div>
        </Portal>
    );
};

export default Modal;
