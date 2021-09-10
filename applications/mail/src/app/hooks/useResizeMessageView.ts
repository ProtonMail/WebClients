import { RefObject, useCallback, useEffect, useState } from 'react';
import { useHotkeys, useWindowSize } from '@proton/components';
import { throttle } from '@proton/shared/lib/helpers/function';

export const useResizeMessageView = (
    containerRef: RefObject<HTMLDivElement>,
    resizeAreaRef: RefObject<HTMLDivElement>,
    listRef: RefObject<HTMLDivElement>
) => {
    const [isResizing, setIsResizing] = useState(false);
    const [windowWidth] = useWindowSize();

    const minWidth = 320; // Smallest mobile breakpoint supported

    // Get left of container to have the size of the sidebar
    const sidebarWidth = containerRef.current ? containerRef.current.getBoundingClientRect().left : 0;
    const resizeAreaWidth = resizeAreaRef.current ? resizeAreaRef.current.getBoundingClientRect().width : 0;

    const maxWidth = windowWidth - sidebarWidth - 400; // Smallest mobile breakpoint supported for message view

    const resize = (newWidth: number) => {
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
        } else if (newWidth < minWidth) {
            newWidth = minWidth;
        }
        document.documentElement.style.setProperty('--width-conversation-column', `${newWidth}px`);
    };

    const resizeWithAmount = (amount: number) => {
        const newWidth = (listRef.current ? listRef.current.getBoundingClientRect().width : 0) + amount;
        resize(newWidth);
    };

    const resizeWithMouse = useCallback(
        (e) => {
            if (isResizing) {
                const newWidth = e.clientX - sidebarWidth - resizeAreaWidth / 2;
                resize(newWidth);
            }
        },
        [isResizing]
    );

    const enableResize = useCallback(() => {
        setIsResizing(true);
    }, [setIsResizing]);

    const disableResize = useCallback(() => {
        setIsResizing(false);
    }, [setIsResizing]);

    useHotkeys(resizeAreaRef, [
        [
            'ArrowRight',
            (e) => {
                e.stopPropagation();
                resizeWithAmount(50);
            },
        ],
        [
            'ArrowLeft',
            (e) => {
                e.stopPropagation();
                resizeWithAmount(-50);
            },
        ],
    ]);

    // If the window is resized, resize to max/min width in case the resizing breaks the view
    useEffect(() => {
        resizeWithAmount(0);
    }, [windowWidth]);

    useEffect(() => {
        const resizeThrottle = throttle(resizeWithMouse, 20);
        document.addEventListener('mousemove', resizeThrottle);
        document.addEventListener('mouseup', disableResize);
        document.addEventListener('mouseleave', disableResize);

        return () => {
            document.removeEventListener('mousemove', resizeThrottle);
            document.removeEventListener('mouseup', disableResize);
            document.addEventListener('mouseleave', disableResize);
        };
    }, [disableResize, resize]);

    return { enableResize };
};
