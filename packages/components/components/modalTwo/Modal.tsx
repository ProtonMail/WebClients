import { AnimationEvent, ElementType, createContext, useLayoutEffect, useState, useRef } from 'react';

import { useChanged, useHotkeys, useInstance } from '../../hooks';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { classnames, generateUID } from '../../helpers';
import { useFocusTrap } from '../focus';
import { Portal } from '../portal';
import './Modal.scss';
import { useModalPosition } from './modalPositions';

export type ModalSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Omission of id from ModalOwnProps because in ModalOwnProps "id"
 * is optional, wheveas in ModalContextValue it is guaranteed.
 * Same for size.
 */
type ModalContextValue = ModalOwnProps & { id: string; size: ModalSize };

export const ModalContext = createContext({} as ModalContextValue);

interface ModalOwnProps {
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
    const last = useModalPosition(open || false);
    const [exiting, setExiting] = useState(false);
    const id = useInstance(() => generateUID('modal'));
    const dialogRef = useRef(null);
    const focusTrapProps = useFocusTrap({
        active: open,
        rootRef: dialogRef,
    });

    const modalContextValue: ModalContextValue = {
        id,
        open,
        size,
        onClose,
        disableCloseOnEscape,
    };

    useChanged(
        {
            value: open,
            from: true,
            to: false,
            effectFn: useLayoutEffect,
        },
        () => {
            setExiting(true);
        }
    );

    useHotkeys(
        dialogRef,
        [
            [
                'Escape',
                (e) => {
                    if (!open) {
                        return;
                    }
                    if (!disableCloseOnEscape) {
                        e.stopPropagation();
                        onClose?.();
                    }
                },
            ],
        ],
        { dependencies: [open] }
    );

    if (!open && !exiting) {
        return null;
    }

    const handleAnimationEnd = ({ animationName }: AnimationEvent<HTMLDivElement>) => {
        if (animationName === 'anime-modal-two-out') {
            setExiting(false);
            onExit?.();
        }
    };

    return (
        <Portal>
            <div
                className={classnames([
                    'modal-two',
                    exiting && 'modal-two--out',
                    fullscreenOnMobile && 'modal-two--fullscreen-on-mobile',
                    fullscreen && 'modal-two--fullscreen',
                    !last && 'modal-two--is-behind-backdrop',
                ])}
                onAnimationEnd={handleAnimationEnd}
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
