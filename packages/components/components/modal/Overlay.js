import React from 'react';
import PropTypes from 'prop-types';

const CLASSES = {
    OVERLAY: 'pm-modalOverlay',
    OVERLAY_OUT: 'pm-modalOverlayOut'
};

const Overlay = ({ children, isClosing, onClick, className: extraClassName, onExit, ...rest }) => {
    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.OVERLAY_OUT && isClosing && onExit) {
            onExit();
        }
    };

    const handleClick = (e) => {
        if (!e.target.classList.contains(CLASSES.OVERLAY)) {
            return;
        }
        onClick(e);
    };

    const className = [CLASSES.OVERLAY, isClosing && CLASSES.OVERLAY_OUT, extraClassName].filter(Boolean).join(' ');

    return (
        <div className={className} onClick={handleClick} onAnimationEnd={handleAnimationEnd} {...rest}>
            {children}
        </div>
    );
};

Overlay.propTypes = {
    onExit: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    isClosing: PropTypes.bool
};

Overlay.defaultProps = {
    className: '',
    isClosing: false
};

export default Overlay;
