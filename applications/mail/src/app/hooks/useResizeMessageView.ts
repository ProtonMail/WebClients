import { RefObject, useCallback, useEffect, useState } from 'react';

import { useHandler, useHotkeys, useWindowSize } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import throttle from '@proton/utils/throttle';

export const useResizeMessageView = (
    containerRef: RefObject<HTMLDivElement>,
    resizeAreaRef: RefObject<HTMLButtonElement>,
    listRef: RefObject<HTMLDivElement>
) => {
    const [isResizing, setIsResizing] = useState(false);
    const [scrollBarWidth, setScrollBarWidth] = useState(0);
    const [windowWidth] = useWindowSize();

    // Original ratio of the messageList
    const realDefaultRatio = 0.35;

    const [defaultRatio, setDefaultRatio] = useState<number>(+(getItem('messageListRatio') || realDefaultRatio));
    const [defaultWindowWidth, setDefaultWindowWidth] = useState(windowWidth);

    // Get left of container to have the size of the sidebar
    const sidebarWidth = containerRef.current ? containerRef.current.getBoundingClientRect().left : 0;

    const saveRatio = useHandler(
        (newWidth: number) => {
            const newRatio = newWidth / windowWidth;
            setDefaultRatio(newRatio);
            setItem('messageListRatio', newRatio.toString());
        },
        { debounce: 2000 }
    );

    const resize = (newWidth: number) => {
        document.documentElement.style.setProperty('--width-conversation-column', `${newWidth}px`);
    };

    const resizeWithAmount = (amount: number) => {
        const newWidth = (listRef.current ? listRef.current.getBoundingClientRect().width : 0) + amount;
        saveRatio(newWidth);
        resize(newWidth);
    };

    const resizeWithMouse = useCallback(
        (e) => {
            if (isResizing) {
                const newWidth = e.clientX - sidebarWidth + scrollBarWidth;
                saveRatio(newWidth);
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
        resize(windowWidth * realDefaultRatio);
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
            resize(windowWidth * defaultRatio);
            setDefaultWindowWidth(windowWidth);
        }
    }, [windowWidth]);

    // When launching the app, set the message view size to the default width (localStorage value if found, else the "real" default value)
    useEffect(() => {
        if (defaultRatio) {
            const defaultWidth = windowWidth * defaultRatio;
            resize(defaultWidth);
        }
    }, [defaultRatio]);

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

    const scrollBarListener = useHandler(
        () => {
            const listRect = listRef.current?.getBoundingClientRect();
            const innerRect = listRef.current?.querySelector('.items-column-list-inner')?.getBoundingClientRect();
            setScrollBarWidth((listRect?.width || 0) - (innerRect?.width || 0));
        },
        { debounce: 100 }
    );

    useEffect(() => {
        scrollBarListener();
        return () => scrollBarListener.abort?.();
    });

    return { enableResize, resetWidth, scrollBarWidth, isResizing };
};
