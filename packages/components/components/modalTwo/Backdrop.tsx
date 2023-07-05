import { useEffect, useState } from 'react';

import { isDialogOpen, isModalOpen, modalTwoBackdropRootClassName } from '@proton/shared/lib/busy';
import clsx from '@proton/utils/clsx';

import './Backdrop.scss';

interface Props {
    exiting: boolean;
    entering: boolean;
}

const Backdrop = ({ entering, exiting }: Props) => {
    const [hidden, setHidden] = useState(true);

    /**
     * Fix for CP-4425
     * There is a possible race condition which means that the backdrop remains visible
     * after opening a link from LinkConfirmationModal
     */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                /**
                 * Remove all modals if no modals are open.
                 * This removes the backdrop if it remains visible.
                 */
                if (!isDialogOpen() && !isModalOpen()) {
                    setHidden(true);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const backdropClassName = clsx([
        modalTwoBackdropRootClassName,
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
