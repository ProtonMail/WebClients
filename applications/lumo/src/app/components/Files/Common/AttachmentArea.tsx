import React, { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useDragArea } from '../../../providers/DragAreaProvider';
import { LumoEyesSVG } from './LumoEyesSVG';

import './AttachmentArea.scss';

export type AttachmentAreaProps = {
    // isDraggingOverScreen: boolean;
    // onToggleFileButton: () => void;
    handleFileProcessing: (file: any) => void;
};

export function AttachmentArea({ handleFileProcessing }: AttachmentAreaProps) {
    const { onDrop } = useDragArea();
    const rootRef = useRef<HTMLDivElement>(null);

    const onDropHandleFiles = useCallback(
        (e: React.DragEvent) => {
            onDrop(e);
            const droppedFiles = Array.from(e.dataTransfer.files);
            droppedFiles.forEach(handleFileProcessing);
        },
        [handleFileProcessing]
    );

    return (
        <div
            className="droparea flex flex-row w-full absolute inset-0 z-50 lumoblur"
            onDrop={onDropHandleFiles}
            ref={rootRef}
        >
            <div className="absolute inset-0 flex flex-column items-center text-center">
                <div className="my-auto flex flex-column flex-nowrap gap-4 color-weak">
                    <div className="flex flex-column flex-nowrap items-center">
                        <LumoEyesSVG />
                    </div>
                    <h1 className="mt-3 h3 text-bold">{c('collider_2025: Title').t`Upload files`}</h1>
                    <p className="m-0">{c('collider_2025: Info')
                        .t`Drag and drop your files here to add them to the chat.`}</p>
                </div>
            </div>
        </div>
    );
}
