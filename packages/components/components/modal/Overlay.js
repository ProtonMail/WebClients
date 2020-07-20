import React from 'react';
import PropTypes from 'prop-types';
import Portal from '../portal/Portal';
import { classnames } from '../../helpers/component';

const CLASSES = {
    OVERLAY: 'pm-modalOverlay',
    OVERLAY_OUT: 'pm-modalOverlayOut',
};

const Overlay = ({ isClosing = false, className: extraClassName = '', onExit, ...rest }) => {
    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.OVERLAY_OUT && isClosing && onExit) {
            onExit();
        }
    };

    return (
        <Portal>
            <div
                className={classnames([CLASSES.OVERLAY, isClosing && CLASSES.OVERLAY_OUT, extraClassName])}
                onAnimationEnd={handleAnimationEnd}
                {...rest}
            />
        </Portal>
    );
};

Overlay.propTypes = {
    onExit: PropTypes.func.isRequired,
    className: PropTypes.string,
    isClosing: PropTypes.bool,
};

export default Overlay;
