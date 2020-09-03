import { useEffect, useCallback, useState } from 'react';

interface Options {
    clearSelections: () => void;
}

function useFileBrowserView({ clearSelections }: Options) {
    const [secondaryActionActive, setSecondaryActionActive] = useState(false);
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const newSecondaryActionIsActive = e.shiftKey || e.metaKey || e.ctrlKey;
            if (newSecondaryActionIsActive !== secondaryActionActive) {
                setSecondaryActionActive(newSecondaryActionIsActive);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyDown);
        };
    }, [secondaryActionActive]);

    const openContextMenu = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeContextMenu = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();

        clearSelections();

        if (isContextMenuOpen) {
            closeContextMenu();
        }

        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }, []);

    return {
        isContextMenuOpen,
        handleContextMenu,
        openContextMenu,
        closeContextMenu,
        contextMenuPosition,
        secondaryActionActive,
    };
}

export default useFileBrowserView;
