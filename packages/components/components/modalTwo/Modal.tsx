import { type ElementType, createContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

import Dialog from '@proton/components/components/dialog/Dialog';
import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { useModalPosition } from '@proton/components/components/modalTwo/modalPositions';
import Portal from '@proton/components/components/portal/Portal';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import useInstance from '@proton/hooks/useInstance';
import usePrevious from '@proton/hooks/usePrevious';
import { type PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

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
     * Allow an additional classname on the root element
     */
    rootClassName?: string;
    /**
     * Fires when the user clicks on the close button or when he
     * presses the escape key, unless 'disableCloseOnEscape' is
     * set to true.
     */
    onClose?: () => void;
    /**
     * Fires when the Modal has finished its enter animation.
     */
    onEnter?: () => void;
    /**
     * Fires when the Modal has finished its exit animation.
     */
    onExit?: () => void;
    /**
     * Fires when the user clicks on the backdrop outside of the Dialog
     */
    onBackdropClick?: () => void;
    /**
     * Whether the modal should close when clicking outside of it.
     */
    enableCloseWhenClickOutside?: boolean;
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
    onEnter,
    onExit,
    onBackdropClick,
    onAnimationEnd,
    disableCloseOnEscape,
    enableCloseWhenClickOutside,
    className,
    rootClassName,
    behind,
    as,
    ...rest
}: PolymorphicPropsWithoutRef<ModalOwnProps, E>) => {
    const [key, setKey] = useState(() => generateUID());
    const [exit, setExit] = useState(() => (open ? ExitState.idle : ExitState.exited));
    const id = useInstance(() => generateUID('modal'));
    const backdropRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef(null);

    const active = exit !== ExitState.exited;
    const last = useModalPosition(active || false);

    const focusTrapProps = useFocusTrap({
        active,
        rootRef: dialogRef,
    });

    const handleClose = () => {
        onClose?.();
    };

    const handleExit = () => {
        setKey(generateUID());
        onExit?.();
    };

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
                    handleClose();
                },
            ],
        ],
        { dependencies: [active, disableCloseOnEscape] }
    );

    /* Relying on a `click` event listener is unsufficient :
     * - user might hold his mouse down and try to cancel the
     * backdrop click by moving away from the backdrop for the
     * mouse up.
     * - `mousedown` will trigger before the `click` event and we
     * may lose focus on any child field currently focused */
    useEffect(() => {
        if (!active) {
            return;
        }
        const handleBackdropMouseDown = (mouseDownEvt: MouseEvent) => {
            /* prevents focus loss when mouse down on backdrop */
            if (mouseDownEvt.target === backdropRef.current) {
                mouseDownEvt.preventDefault();
                backdropRef.current?.addEventListener(
                    'mouseup',
                    (mouseUpEvt) => mouseUpEvt.target === backdropRef.current && onBackdropClick?.(),
                    { once: true }
                );
            }
        };

        backdropRef.current?.addEventListener('mousedown', handleBackdropMouseDown);

        return () => backdropRef.current?.removeEventListener('mousedown', handleBackdropMouseDown);
    }, [onBackdropClick, active]);

    if (!active) {
        return null;
    }

    const exiting = exit === ExitState.exiting;
    const Element: ElementType = as || defaultElement;

    return (
        <Portal>
            <div
                ref={backdropRef}
                className={clsx([
                    modalTwoRootClassName,
                    rootClassName,
                    exiting && 'modal-two--out',
                    fullscreenOnMobile && 'modal-two--fullscreen-on-mobile',
                    fullscreen && 'modal-two--fullscreen',
                    (!last || behind) && 'modal-two--is-behind-backdrop',
                ])}
                onAnimationEnd={({ animationName }) => {
                    if (animationName === 'anime-modal-two-in') {
                        onEnter?.();
                    }
                    if (exiting && animationName === 'anime-modal-two-out') {
                        setExit(ExitState.exited);
                        handleExit();
                    }
                }}
                onClick={(e) => {
                    if (enableCloseWhenClickOutside && e.target === e.currentTarget) {
                        handleClose();
                    }
                }}
            >
                <Dialog
                    ref={dialogRef}
                    aria-labelledby={id}
                    aria-describedby={`${id}-description`}
                    {...focusTrapProps}
                    className={clsx([
                        'modal-two-dialog outline-none',
                        className,
                        size === 'small' && 'modal-two-dialog--small',
                        size === 'large' && 'modal-two-dialog--large',
                        size === 'xlarge' && 'modal-two-dialog--xlarge',
                        size === 'full' && 'modal-two-dialog--full',
                    ])}
                >
                    <ModalContext.Provider value={modalContextValue}>
                        <Element className="modal-two-dialog-container" {...rest} key={key} />
                    </ModalContext.Provider>
                </Dialog>
            </div>
        </Portal>
    );
};

export default Modal;
