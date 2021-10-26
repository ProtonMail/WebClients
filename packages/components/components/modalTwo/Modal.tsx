import {
    AnimationEvent,
    ComponentPropsWithoutRef,
    createContext,
    ReactNode,
    useEffect,
    useLayoutEffect,
    useState,
    useRef,
} from 'react';

import { useChanged, useInstance } from '../../hooks';
import { classnames, generateUID } from '../../helpers';
import { useFocusTrap } from '../focus';
import { Portal } from '../portal';
import './Modal.scss';

type ModalContextValue = Omit<ModalOwnProps, 'children'> & { id: string };

export const ModalContext = createContext({} as ModalContextValue);

const ModalProvider = ({ children, ...rest }: ModalContextValue & { children: ReactNode }) => {
    return <ModalContext.Provider value={rest}>{children}</ModalContext.Provider>;
};

interface ModalOwnProps {
    /**
     * Whether the modal is open or not.
     */
    open?: boolean;
    small?: boolean;
    medium?: boolean;
    large?: boolean;
    full?: boolean;
    fullscreenOnMobile?: boolean;
    /**
     * Disables closing the modal by pressing the 'Escape' key.
     */
    disableCloseOnEscape?: boolean;
    /**
     * Fires when the user clicks on the close button or when he
     * presses the escape key, unless 'disableCloseOnEscape' is
     * set to true.
     */
    onClose?: () => void;
}

export type ModalProps = ModalOwnProps & ComponentPropsWithoutRef<'div'>;

const Modal = (props: ModalProps) => {
    const {
        open,
        small,
        large,
        full,
        fullscreenOnMobile,
        children,
        onClose,
        disableCloseOnEscape,
        className,
        ...rest
    } = props;

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
        small,
        large,
        full,
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!disableCloseOnEscape && e.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!open && !exiting) {
        return null;
    }

    const handleAnimationEnd = ({ animationName }: AnimationEvent<HTMLDivElement>) => {
        if (animationName === 'anime-modal-two-backdrop-out') {
            setExiting(false);
        }
    };

    const backdropClassname = classnames([
        'modal-two-backdrop',
        exiting && 'modal-two-backdrop--out',
        fullscreenOnMobile && 'modal-two-backdrop--fullscreen-on-mobile',
    ]);

    const dialogClassName = classnames([
        'modal-two',
        className,
        small && 'modal-two--small',
        large && 'modal-two--large',
        full && 'modal-two--full',
    ]);

    return (
        <Portal>
            <div className={backdropClassname} onAnimationEnd={handleAnimationEnd}>
                <dialog
                    ref={dialogRef}
                    className={dialogClassName}
                    aria-labelledby={id}
                    aria-describedby={`${id}-description`}
                    {...rest}
                    {...focusTrapProps}
                >
                    <ModalProvider {...modalContextValue}>{children}</ModalProvider>
                </dialog>
            </div>
        </Portal>
    );
};

export default Modal;
