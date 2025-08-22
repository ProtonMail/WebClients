import { useEffect } from 'react';

import { Portal } from '@proton/components/components/portal';

interface Props {
    show: boolean;
    onAnimationComplete?: () => void;
}

const LumoPlusBackdropOverlay = ({ show, onAnimationComplete }: Props) => {
    useEffect(() => {
        if (show) {
            // Find and hide the backdrop elements - use a more robust approach
            const hideBackdrops = () => {
                const backdropElements = document.querySelectorAll('.modal-two-backdrop');
                backdropElements.forEach((element) => {
                    if (element.classList.contains('modal-two-backdrop--in')) {
                        (element as HTMLElement).classList.add('lumo-backdrop-hidden');
                    }
                });
            };

            // Hide immediately
            hideBackdrops();

            // Also check periodically in case backdrop appears later
            const interval = setInterval(hideBackdrops, 100);

            // Call the callback earlier so modal shows sooner
            const timer = setTimeout(() => {
                onAnimationComplete?.();
            }, 200); // Show modal halfway through animation

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
                // Cleanup: remove the class when component unmounts
                const backdropElements = document.querySelectorAll('.modal-two-backdrop');
                backdropElements.forEach((element) => {
                    (element as HTMLElement).classList.remove('lumo-backdrop-hidden');
                });
            };
        }
    }, [show, onAnimationComplete]);

    if (!show) {
        return null;
    }

    // Simplified - no need for dynamic origins with clip-path approach

    return (
        <Portal>
            <div
                className="lumo-plus-backdrop-overlay lumo-backdrop-sweeping"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 899,
                    pointerEvents: 'none',
                    background:
                        'linear-gradient(45deg, rgb(255, 172, 46) -20.77%, rgb(221, 93, 203) 49.4%, rgb(93, 93, 207) 85.84%)',
                }}
            />
        </Portal>
    );
};

export default LumoPlusBackdropOverlay;
