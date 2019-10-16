import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Portal from '../portal/Portal';
import { classnames } from '../../helpers/component';

const CLASSES = {
    MODAL: 'pm-modal',
    MODAL_OUT: 'pm-modalOut',
    MODAL_SMALL: 'pm-modal--smaller'
};

/** @type any */
const Dialog = ({
    onExit,
    small: isSmall = false,
    isClosing = false,
    isBehind = false,
    modalTitleID,
    children,
    onClose,
    className: extraClassNames = '',
    ...rest
}) => {
    const isContainerClick = useRef(false);

    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.MODAL_OUT && isClosing) {
            onExit && onExit();
        }
    };

    /**
     * Handle click outside of the dialog by listening to mousedown and mouseup
     * to solve the case where a user starts her click inside the dialog, and
     * releases the click outside of the dialog. Since it's not possible to
     * stop propagation in this case, ensure that mouseDown and mouseUp were
     * both targeting outside of the container.
     */
    const handleMouseDown = (e) => {
        isContainerClick.current = e.currentTarget === e.target;
    };
    const handleMouseUp = (e) => {
        isContainerClick.current = isContainerClick.current && e.currentTarget === e.target;
    };
    const handleClick = () => {
        if (isContainerClick.current) {
            return onClose();
        }
    };

    return (
        <Portal>
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onClick={handleClick}
                className={classnames(['pm-modalContainer', isBehind && 'pm-modalContainer--inBackground'])}
            >
                <dialog
                    aria-labelledby={modalTitleID}
                    aria-modal="true"
                    role="dialog"
                    open
                    className={classnames([
                        CLASSES.MODAL,
                        isSmall && CLASSES.MODAL_SMALL,
                        isClosing && CLASSES.MODAL_OUT,
                        extraClassNames
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                    {...rest}
                >
                    {children}
                </dialog>
            </div>
        </Portal>
    );
};

Dialog.propTypes = {
    onExit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    className: PropTypes.string,
    small: PropTypes.bool,
    isBehind: PropTypes.bool,
    isClosing: PropTypes.bool
};

export default Dialog;
