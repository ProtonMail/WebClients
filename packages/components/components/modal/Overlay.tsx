import Portal from '../portal/Portal';
import { classnames } from '../../helpers';

const CLASSES = {
    OVERLAY: 'modal-overlay',
    OVERLAY_OUT: 'modal-overlay--out',
};

const ANIMATIONS = {
    OVERLAY_OUT: 'anime-modal-overlay-out',
};

interface Props extends React.ComponentPropsWithoutRef<'div'> {
    isClosing?: boolean;
    className?: string;
    onExit?: () => void;
    onStart?: () => void;
}
const Overlay = ({ isClosing = false, className: extraClassName = '', onExit, onStart, ...rest }: Props) => {
    return (
        <Portal>
            <div
                className={classnames([CLASSES.OVERLAY, isClosing && CLASSES.OVERLAY_OUT, extraClassName])}
                onAnimationStart={({ animationName }) => {
                    if (animationName === ANIMATIONS.OVERLAY_OUT && isClosing) {
                        onStart?.();
                    }
                }}
                onAnimationEnd={({ animationName }) => {
                    if (animationName === ANIMATIONS.OVERLAY_OUT && isClosing) {
                        onExit?.();
                    }
                }}
                {...rest}
            />
        </Portal>
    );
};

export default Overlay;
