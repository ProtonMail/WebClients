import { RefObject, useEffect, useRef, useState } from 'react';

export const isDragFile = (event: DragEvent) => event.dataTransfer?.types.includes('Files');

const useComposerDrag = (iframeRef: RefObject<HTMLIFrameElement>, onAddAttachments?: (files: File[]) => void) => {
    const counter = useRef(0);
    const [dragStatus, setDragState] = useState<'inside' | 'outside'>('outside');

    useEffect(() => {
        const iframeDoc = iframeRef.current?.contentDocument;
        if (!iframeDoc || !onAddAttachments) {
            return;
        }

        const handleDragEnter = (event: DragEvent) => {
            if (isDragFile(event)) {
                counter.current = counter.current + 1;
                setDragState('inside');
            }
        };

        iframeDoc?.addEventListener('dragenter', handleDragEnter);

        const handleDragLeave = (event: DragEvent) => {
            if (isDragFile(event)) {
                counter.current = counter.current - 1;
                if (counter.current === 0) {
                    setDragState('outside');
                }
            }
        };
        iframeDoc?.addEventListener('dragleave', handleDragLeave);

        const handleDragOver = (event: DragEvent) => {
            if (isDragFile(event)) {
                if (event.dataTransfer?.effectAllowed === 'all') {
                    event.dataTransfer.dropEffect = 'move';
                }
                event.preventDefault();
            }
        };

        iframeDoc?.addEventListener('dragover', handleDragOver);

        const handleDrop = (event: DragEvent) => {
            event.preventDefault();
            // reset drag state to display the composer content
            counter.current = 0;
            setDragState('outside');
            if (event.dataTransfer?.files) {
                onAddAttachments?.([...event.dataTransfer.files]);
            }
        };

        iframeDoc?.addEventListener('drop', handleDrop);

        return () => {
            iframeDoc.removeEventListener('dragenter', handleDragEnter);
            iframeDoc.removeEventListener('dragleave', handleDragLeave);
            iframeDoc.removeEventListener('dragover', handleDragOver);
            iframeDoc.removeEventListener('drop', handleDrop);
        };
    }, []);

    return dragStatus === 'inside';
};

export default useComposerDrag;
