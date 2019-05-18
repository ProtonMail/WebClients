import React from 'react';
import PropTypes from 'prop-types';

const CLASSES = {
    MODAL: 'pm-modal',
    MODAL_OUT: 'pm-modalOut',
    MODAL_SMALL: 'pm-modal--smaller',
    MODAL_BACKGROUND: 'pm-modal--inBackground'
};

const Dialog = ({
    onExit,
    small: isSmall,
    isClosing,
    isBehind,
    modalTitleID,
    children,
    className: extraClassNames,
    ...rest
}) => {
    const className = [
        CLASSES.MODAL,
        isSmall && CLASSES.MODAL_SMALL,
        isClosing && CLASSES.MODAL_OUT,
        isBehind && CLASSES.MODAL_BACKGROUND,
        extraClassNames
    ]
        .filter(Boolean)
        .join(' ');

    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.MODAL_OUT && isClosing) {
            onExit && onExit();
        }
    };

    return (
        <dialog
            className={className}
            aria-labelledby={modalTitleID}
            aria-modal="true"
            role="dialog"
            open
            onAnimationEnd={handleAnimationEnd}
            {...rest}
        >
            {children}
        </dialog>
    );
};

Dialog.propTypes = {
    onExit: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    className: PropTypes.string,
    small: PropTypes.bool,
    isBehind: PropTypes.bool,
    isClosing: PropTypes.bool
};

Dialog.defaultProps = {
    className: '',
    small: false,
    isBehind: false,
    isClosing: false
};

export default Dialog;
