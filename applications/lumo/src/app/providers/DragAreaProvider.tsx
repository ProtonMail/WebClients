import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { AttachmentArea } from '../components/Files';

type FileDropHandler = (file: File) => void;

interface DragAreaData {
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    registerFileDropHandler: (handler: FileDropHandler) => () => void;
}

const DragAreaContext = createContext<DragAreaData>({
    isDragging: false,
    onDragOver: (_) => {},
    onDragEnter: (_) => {},
    onDragLeave: (_) => {},
    onDrop: (_) => {},
    registerFileDropHandler: () => () => {},
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

const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes('Files');

export const DragAreaProvider = ({ children }: DragAreaProviderProps) => {
    const [count, setCount] = useState(0);
    const fileDropHandlerRef = useRef<FileDropHandler | null>(null);
    const [hasFileDropHandler, setHasFileDropHandler] = useState(false);

    const registerFileDropHandler = useCallback((handler: FileDropHandler) => {
        fileDropHandlerRef.current = handler;
        setHasFileDropHandler(true);
        return () => {
            fileDropHandlerRef.current = null;
            setHasFileDropHandler(false);
        };
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        if (!isFileDrag(e)) {
            return;
        }
        e.preventDefault();
    }, []);

    const onDragEnter = useCallback((e: React.DragEvent) => {
        if (!isFileDrag(e)) {
            return;
        }
        e.preventDefault();
        setCount((count) => count + 1);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        if (!isFileDrag(e)) {
            return;
        }
        e.preventDefault();
        setCount((count) => Math.max(count - 1, 0));
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setCount(0);
    }, []);

    const onDropWithFiles = useCallback(
        (e: React.DragEvent) => {
            e.stopPropagation();
            onDrop(e);
            for (const file of Array.from(e.dataTransfer.files)) {
                fileDropHandlerRef.current?.(file);
            }
        },
        [onDrop]
    );

    const isDragging = count > 0;

    return (
        <DragAreaContext.Provider
            value={{ isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, registerFileDropHandler }}
        >
            <div
                className="drag-area-provider h-full w-full min-h-0 min-w-0 flex flex-column"
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
            >
                {children}
                {isDragging && hasFileDropHandler && <AttachmentArea onDrop={onDropWithFiles} />}
            </div>
        </DragAreaContext.Provider>
    );
};
