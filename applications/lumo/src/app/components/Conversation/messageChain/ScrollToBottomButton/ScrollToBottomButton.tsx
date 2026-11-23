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
    composerContainerRef: React.RefObject<HTMLDivElement | null>;
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
                className="absolute z-50 flex justify-center w-full transition-all duration-200 lumo-easing-standard"
                style={{
                    bottom: `${composerPosition.height + 32}px`,
                    insetInlineStart: 0,
                    transform: show ? 'translateY(0)' : 'translateY(8px)',
                    opacity: show ? 1 : 0,
                    pointerEvents: 'none',
                }}
            >
                <Tooltip title={c('Action').t`Scroll to bottom`}>
                    <button
                        onClick={onClick}
                        className="scroll-to-bottom-button flex items-center justify-center border rounded-50 lumo-color-glyph lumo-bg-panel lumo-elevation-4 hover:shadow-norm cursor-pointer"
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
