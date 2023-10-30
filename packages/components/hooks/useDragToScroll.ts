import { MouseEvent as ReactMouseEvent, RefObject, useEffect, useState } from 'react';

/**
 * This hook will allow any element to be scrolled by dragging it
 * @param ref
 * @param defaultCursor
 */
export function useDragToScroll(ref: RefObject<HTMLElement>, { defaultCursor } = { defaultCursor: 'default' }) {
    let initialPosition = { scrollTop: 0, scrollLeft: 0, mouseX: 0, mouseY: 0 };

    // We check if element is scrollable or not. So we only show the grab if it can be grab
    const [isScrollable, setIsScrollable] = useState(false);
    const scrollHeight = ref?.current?.scrollHeight;
    const clientHeight = ref?.current?.clientHeight;

    useEffect(() => {
        if (scrollHeight && clientHeight) {
            setIsScrollable(scrollHeight > clientHeight);
        }
    }, [scrollHeight, clientHeight]);

    useEffect(() => {
        if (!ref.current) {
            return;
        }
        ref.current.style.cursor = isScrollable ? 'grab' : defaultCursor;
    }, [isScrollable]);

    const handleMouseMove = (event: MouseEvent) => {
        if (!ref.current) {
            return;
        }
        ref.current.scrollTop = initialPosition.scrollTop - (event.clientY - initialPosition.mouseY);
        ref.current.scrollLeft = initialPosition.scrollLeft - (event.clientX - initialPosition.mouseX);
    };

    const handleMouseUp = () => {
        if (ref.current) {
            ref.current.style.cursor = isScrollable ? 'grab' : defaultCursor;
        }

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const onMouseDown = (event: ReactMouseEvent) => {
        if (!ref.current || !isScrollable) {
            return;
        }
        // Prevent image default drop event
        event.preventDefault();
        initialPosition = {
            scrollLeft: ref.current.scrollLeft,
            scrollTop: ref.current.scrollTop,
            mouseX: event.clientX,
            mouseY: event.clientY,
        };

        ref.current.style.cursor = 'grabbing';
        ref.current.style.userSelect = 'none';

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    return { onMouseDown };
}
