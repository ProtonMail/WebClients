import { RefObject, useCallback, useEffect, useState } from 'react';
import { useHotkeys, useWindowSize } from '@proton/components';
import { debounce, throttle } from '@proton/shared/lib/helpers/function';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

export const useResizeMessageView = (
    containerRef: RefObject<HTMLDivElement>,
    resizeAreaRef: RefObject<HTMLDivElement>,
    listRef: RefObject<HTMLDivElement>
) => {
    const [isResizing, setIsResizing] = useState(false);
    const [windowWidth] = useWindowSize();

    // Original width of the messageList
    const realDefaultWidth = windowWidth * 0.35;

    const [defaultWidth] = useState<number>(+(getItem('messageListWidth') || realDefaultWidth));
    const [defaultWindowWidth, setDefaultWindowWidth] = useState(windowWidth);

    // Get left of container to have the size of the sidebar
    const sidebarWidth = containerRef.current ? containerRef.current.getBoundingClientRect().left : 0;
    const resizeAreaWidth = resizeAreaRef.current ? resizeAreaRef.current.getBoundingClientRect().width : 0;

    const minWidth = 320; // Smallest mobile breakpoint supported
    const maxWidth = windowWidth - sidebarWidth - 400; // Smallest mobile breakpoint supported for message view

    const saveWidth = debounce((newWidth: number) => {
        setItem('messageListWidth', newWidth.toString());
    }, 2000);

    const resize = (newWidth: number) => {
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
        } else if (newWidth < minWidth) {
            newWidth = minWidth;
        }
        document.documentElement.style.setProperty('--width-conversation-column', `${newWidth}px`);
        saveWidth(newWidth);
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

    const resetWidth = () => {
        resize(realDefaultWidth);
    };

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

    // If the window is resized, resize the width too
    useEffect(() => {
        if (windowWidth !== defaultWindowWidth) {
            const currentWidth = listRef.current ? listRef.current.getBoundingClientRect().width : 0;
            resize(windowWidth * (currentWidth / defaultWindowWidth));
            setDefaultWindowWidth(windowWidth);
        }
    }, [windowWidth]);

    // When launching the app, set the message view size to the default width (localStorage value if found, else the "real" default value)
    useEffect(() => {
        if (defaultWidth) {
            document.documentElement.style.setProperty('--width-conversation-column', `${defaultWidth}px`);
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

    return { enableResize, resetWidth };
};
