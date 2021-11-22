import { useEffect, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { dialogRootClassName } from '@proton/shared/lib/busy';

import Portal from '../portal/Portal';
import { classnames } from '../../helpers';
import { useFocusTrap } from '../focus';
import { useHotkeys } from '../../hooks';
import { useModalPosition } from '../modalTwo/modalPositions';

const CLASSES = {
    MODAL: 'modal',
    MODAL_IN: 'modal--in',
    MODAL_OUT: 'modal--out',
    MODAL_INTERMEDIATE: 'modal--intermediate',
    MODAL_SMALL: 'modal--smaller',
    MODAL_TINY: 'modal--tiny',
};

const ANIMATIONS = {
    MODAL_IN: 'anime-modal-in',
    MODAL_OUT: 'anime-modal-out',
};

/** @type any */
const Dialog = ({
    onClose,
    onEnter,
    onExit,
    intermediate: isIntermediate = false,
    small: isSmall = false,
    tiny: isTiny = false,
    isClosing = false,
    modalTitleID,
    children,
    className: extraClassNames = '',
    disableCloseOnOnEscape,
    ...rest
}) => {
    const rootRef = useRef(null);
    const hasCalledExit = useRef(false);
    const hasCalledClose = useRef(false);
    const focusTrapProps = useFocusTrap({ rootRef });
    const last = useModalPosition(true);

    useLayoutEffect(() => {
        hasCalledClose.current = isClosing;
    }, [isClosing]);

    useEffect(() => {
        return () => {
            // Safety measure to make sure cleanup functions always get called, even if the component gets forcefully removed
            if (!hasCalledClose.current) {
                onClose?.();
            }
            if (!hasCalledExit.current) {
                onExit?.();
            }
        };
    }, []);

    useHotkeys(rootRef, [
        [
            'Escape',
            (e) => {
                if (!disableCloseOnOnEscape) {
                    e.stopPropagation();
                    onClose?.();
                }
            },
        ],
    ]);

    return (
        <Portal>
            <div className={classnames([dialogRootClassName])} style={!last ? { '--z-position': -1 } : undefined}>
                <dialog
                    aria-labelledby={modalTitleID}
                    aria-modal="true"
                    open
                    className={classnames([
                        CLASSES.MODAL,
                        isSmall && CLASSES.MODAL_SMALL,
                        isTiny && CLASSES.MODAL_TINY,
                        isIntermediate && CLASSES.MODAL_INTERMEDIATE,
                        (isSmall || isTiny || isIntermediate) && 'modal--shorter-labels',
                        isClosing && CLASSES.MODAL_OUT,
                        extraClassNames,
                        'no-outline',
                    ])}
                    onAnimationEnd={({ animationName }) => {
                        if (animationName === ANIMATIONS.MODAL_OUT && isClosing) {
                            hasCalledExit.current = true;
                            onExit?.();
                        }
                        if (animationName === ANIMATIONS.MODAL_IN && !isClosing) {
                            onEnter?.();
                        }
                    }}
                    {...rest}
                    ref={rootRef}
                    {...focusTrapProps}
                >
                    {children}
                </dialog>
            </div>
        </Portal>
    );
};

Dialog.propTypes = {
    onEnter: PropTypes.func,
    onExit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    className: PropTypes.string,
    small: PropTypes.bool,
    isClosing: PropTypes.bool,
    disableCloseOnOnEscape: PropTypes.bool,
};

export default Dialog;
