import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from 'applications/lumo/src/app/types';

const useCollapsibleMessageContent = (message: Message) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showCollapseButton, setShowCollapseButton] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const checkOverflow = useCallback(() => {
        if (!contentRef.current) return;

        const element = contentRef.current;
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);

        // Use scrollHeight to get the natural content height, even when truncated
        const naturalHeight = element.scrollHeight;

        // If content is taller than ~1.5 lines, show button
        setShowCollapseButton(naturalHeight > lineHeight * 1.5);
    }, []);

    useEffect(() => {
        if (!contentRef.current) return;

        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(contentRef.current);

        checkOverflow();

        return () => resizeObserver.disconnect();
    }, [message, checkOverflow]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    return { contentRef, isCollapsed, showCollapseButton, toggleCollapse };
};

export default useCollapsibleMessageContent;
