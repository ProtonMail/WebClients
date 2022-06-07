import { useCallback, useState } from 'react';

export function useContextMenuControls() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>();

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
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
