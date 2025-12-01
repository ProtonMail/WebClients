import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

import './ScrollToBottomButton.scss';

export const ScrollToBottomButton = ({
    onClick,
    show,
    composerContainerRef,
}: {
    onClick: () => void;
    show: boolean;
    composerContainerRef: React.RefObject<HTMLDivElement>;
}) => {
    const [composerHeight, setComposerHeight] = useState(0);

    useEffect(() => {
        const updateComposerPosition = () => {
            if (composerContainerRef.current) {
                const rect = composerContainerRef.current.getBoundingClientRect();
                setComposerHeight(rect.height);
            }
        };

        updateComposerPosition();

        // Use ResizeObserver for composer size changes
        let resizeObserver: ResizeObserver | null = null;
        if (composerContainerRef.current) {
            resizeObserver = new ResizeObserver(updateComposerPosition);
            resizeObserver.observe(composerContainerRef.current);
        }

        // Listen for scroll and resize events
        window.addEventListener('scroll', updateComposerPosition);
        window.addEventListener('resize', updateComposerPosition);

        return () => {
            window.removeEventListener('scroll', updateComposerPosition);
            window.removeEventListener('resize', updateComposerPosition);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [composerContainerRef]);

    return (
        <div
            className="absolute w-full z-50 flex justify-center"
            style={{
                bottom: `${composerHeight + 28}px`,
                transform: show ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 200ms ease-in-out',
                opacity: show ? 1 : 0,
                pointerEvents: 'none',
            }}
        >
            <Tooltip title={c('Action').t`Scroll to bottom`}>
                <button
                    onClick={onClick}
                    className="scroll-to-bottom-button shadow-lifted hover:shadow-norm flex items-center justify-center cursor-pointer rounded-50 border border-weak bg-norm color-norm"
                    aria-label={c('Action').t`Scroll to bottom`}
                    style={{
                        pointerEvents: 'auto',
                    }}
                >
                    <IcChevronDown />
                </button>
            </Tooltip>
        </div>
    );
};
