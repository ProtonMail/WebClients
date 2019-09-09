import React from 'react';
import PropTypes from 'prop-types';
import Portal from '../portal/Portal';
import { classnames } from '../../helpers/component';

const CLASSES = {
    MODAL: 'pm-modal',
    MODAL_OUT: 'pm-modalOut',
    MODAL_SMALL: 'pm-modal--smaller'
};

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
    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.MODAL_OUT && isClosing) {
            onExit && onExit();
        }
    };

    const handleClick = ({ currentTarget, target }) => {
        if (currentTarget === target) {
            return onClose();
        }
    };

    return (
        <Portal>
            <div
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
