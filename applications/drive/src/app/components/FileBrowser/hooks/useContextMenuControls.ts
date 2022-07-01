import { useCallback, useState, useRef } from 'react';

const DROPDOWN_ANIMATION_TIME = 200; // ms

export function useContextMenuControls() {
    const lastCloseTime = useRef<number>();
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>();

    const open = useCallback(() => {
        // Quick hack.
        // Dropdown does not recompute the height right away and if the context
        // menu is open quickly with another content, scrollbar or empty space
        // is displayed.
        // The better solution would be to not count the new height at the end
        // of the animation but sooner. That is tricky and can affect all apps.
        // Please find better solution once you are around.
        const delay = !lastCloseTime.current ? 0 : DROPDOWN_ANIMATION_TIME - (Date.now() - lastCloseTime.current);
        setTimeout(() => setIsOpen(true), Math.max(delay, 0));
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        lastCloseTime.current = Date.now();
    }, []);

    const handleContextMenu = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        e.preventDefault();

        setPosition({ top: e.clientY, left: e.clientX });
    };

    const handleContextMenuTouch = (e: React.TouchEvent<Element>) => {
        e.stopPropagation();
        e.preventDefault();
        const touch = e.touches[0];

        setPosition({ top: touch.clientY, left: touch.clientX });
    };

    const resetPosition = () => {
        setPosition(undefined);
    };

    const value = {
        isOpen,
        handleContextMenu,
        handleContextMenuTouch,
        open,
        close,
        position,
        resetPosition,
    };

    return value;
}
