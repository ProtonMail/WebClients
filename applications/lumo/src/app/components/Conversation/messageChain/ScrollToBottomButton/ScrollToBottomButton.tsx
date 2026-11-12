import React, { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../../../LumoIcon/LumoIcon';

import './ScrollToBottomButton.scss';

export const ScrollToBottomButton = ({
    onClick,
    show,
    composerContainerRef,
    floatingContent,
}: {
    onClick: () => void;
    show: boolean;
    composerContainerRef: React.RefObject<HTMLDivElement>;
    floatingContent?: React.ReactNode;
}) => {
    const floatingContainerRef = useRef<HTMLDivElement>(null);
    const [composerPosition, setComposerPosition] = useState({ height: 0, topOffset: 0 });

    useEffect(() => {
        const updateComposerPosition = () => {
            if (composerContainerRef.current) {
                const rect = composerContainerRef.current.getBoundingClientRect();
                const parent = floatingContainerRef.current?.offsetParent;
                const parentBottom = parent?.getBoundingClientRect().bottom ?? rect.bottom;
                setComposerPosition({ height: rect.height, topOffset: parentBottom - rect.top });
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
        <>
            <div
                ref={floatingContainerRef}
                className="absolute w-full z-50 flex justify-center"
                style={{ bottom: `${composerPosition.topOffset + 16}px`, insetInlineStart: 0, pointerEvents: 'none' }}
            >
                {floatingContent}
            </div>
            <div
                className="absolute w-full z-50 flex justify-center"
                style={{
                    bottom: `${composerPosition.height + 32}px`,
                    insetInlineStart: 0,
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
                        style={{ pointerEvents: show ? 'auto' : 'none' }}
                    >
                        <LumoIcon name="ChevronDown" />
                    </button>
                </Tooltip>
            </div>
        </>
    );
};
