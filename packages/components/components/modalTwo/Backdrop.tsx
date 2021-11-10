import { useState } from 'react';
import { classnames } from '../../helpers';
import './Backdrop.scss';

interface Props {
    exiting: boolean;
    entering: boolean;
}

const Backdrop = ({ entering, exiting }: Props) => {
    const [hidden, setHidden] = useState(true);

    const backdropClassName = classnames([
        'modal-two-backdrop',
        entering && 'modal-two-backdrop--in',
        exiting && 'modal-two-backdrop--out',
        !entering && hidden && 'hidden',
    ]);

    return (
        <div
            className={backdropClassName}
            onAnimationStart={({ animationName }) => {
                if (animationName === 'anime-modal-two-backdrop-in' && entering) {
                    setHidden(false);
                }
            }}
            onAnimationEnd={({ animationName }) => {
                if (animationName === 'anime-modal-two-backdrop-out' && exiting) {
                    setHidden(true);
                }
            }}
        />
    );
};

export default Backdrop;
