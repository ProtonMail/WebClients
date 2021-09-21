import { RefObject, useCallback, useEffect, useState } from 'react';
import { useHotkeys, useWindowSize } from '@proton/components';
import { throttle } from '@proton/shared/lib/helpers/function';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

export const useResizeMessageView = (
    containerRef: RefObject<HTMLDivElement>,
    resizeAreaRef: RefObject<HTMLDivElement>,
    listRef: RefObject<HTMLDivElement>
) => {
    const [isResizing, setIsResizing] = useState(false);
    const [windowWidth] = useWindowSize();
    const [defaultWidth, setDefaultWidth] = useState<number>(+(getItem('messageListWidth') || windowWidth * 0.35));
    const [defaultWindowWidth, setDefaultWindowWidth] = useState(windowWidth);
    const [windowRatio, setWindowRatio] = useState(defaultWidth / windowWidth);

    // Get left of container to have the size of the sidebar
    const sidebarWidth = containerRef.current ? containerRef.current.getBoundingClientRect().left : 0;
    const resizeAreaWidth = resizeAreaRef.current ? resizeAreaRef.current.getBoundingClientRect().width : 0;

    const minWidth = 320; // Smallest mobile breakpoint supported
    const maxWidth = windowWidth - sidebarWidth - 400; // Smallest mobile breakpoint supported for message view

    const saveWidth = () => {
        setItem('messageListWidth', defaultWidth.toString());
    };

    const resize = (newWidth: number) => {
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
        } else if (newWidth < minWidth) {
            newWidth = minWidth;
        }
        setDefaultWidth(newWidth);
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

    // If the window is resized, resize the width using the ratio
    useEffect(() => {
        if (windowWidth !== defaultWindowWidth) {
            resize(windowWidth * windowRatio);
            setDefaultWindowWidth(defaultWindowWidth);
        }
    }, [windowWidth]);

    // When defaultWidth is changing, set the size on the UI, recalculate the ratio and save the width in the localStorage
    useEffect(() => {
        if (defaultWidth) {
            setWindowRatio(defaultWidth / windowWidth);
            document.documentElement.style.setProperty('--width-conversation-column', `${defaultWidth}px`);
            saveWidth();
        }
    }, [defaultWidth]);

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
