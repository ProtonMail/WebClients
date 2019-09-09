import React from 'react';
import PropTypes from 'prop-types';
import Portal from '../portal/Portal';

const CLASSES = {
    OVERLAY: 'pm-modalOverlay',
    OVERLAY_OUT: 'pm-modalOverlayOut'
};

const Overlay = ({ isClosing = false, className: extraClassName = '', onExit, ...rest }) => {
    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.OVERLAY_OUT && isClosing && onExit) {
            onExit();
        }
    };

    const className = [CLASSES.OVERLAY, isClosing && CLASSES.OVERLAY_OUT, extraClassName].filter(Boolean).join(' ');

    return (
        <Portal>
            <div className={className} onAnimationEnd={handleAnimationEnd} {...rest} />
        </Portal>
    );
};

Overlay.propTypes = {
    onExit: PropTypes.func.isRequired,
    className: PropTypes.string,
    isClosing: PropTypes.bool
};

export default Overlay;
