import React, { createContext, useCallback, useContext, useState } from 'react';

interface DragAreaData {
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

const DragAreaContext = createContext<DragAreaData>({
    isDragging: false,
    onDragOver: (_) => {},
    onDragEnter: (_) => {},
    onDragLeave: (_) => {},
    onDrop: (_) => {},
});

export const useDragArea = () => {
    const context = useContext(DragAreaContext);
    if (context === null) {
        throw new Error('useDragArea must be used within an DragAreaProvider');
    }
    return context;
};

interface DragAreaProviderProps {
    children: React.ReactNode;
}

export const DragAreaProvider = ({ children }: DragAreaProviderProps) => {
    const [count, setCount] = useState(0);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setCount((count) => count + 1);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setCount((count) => Math.max(count - 1, 0));
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setCount(0);
    }, []);

    return (
        <DragAreaContext.Provider value={{ isDragging: count > 0, onDragEnter, onDragLeave, onDragOver, onDrop }}>
            {children}
        </DragAreaContext.Provider>
    );
};
