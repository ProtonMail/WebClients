import PropTypes from 'prop-types';
import Portal from '../portal/Portal';
import { classnames } from '../../helpers';

const CLASSES = {
    OVERLAY: 'modal-overlay',
    OVERLAY_OUT: 'modal-overlay--out',
};

const ANIMATIONS = {
    OVERLAY_OUT: 'anime-modal-overlay-out',
};

const Overlay = ({ isClosing = false, className: extraClassName = '', onExit, ...rest }) => {
    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === ANIMATIONS.OVERLAY_OUT && isClosing && onExit) {
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
