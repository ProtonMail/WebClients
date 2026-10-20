import type { ReactNode, SyntheticEvent } from 'react';
import { useCallback } from 'react';

import { c } from 'ttag';

import dragdropImageSvg from '@proton/styles/assets/img/illustrations/drag-and-drop.svg';

import { useUploadDragDropOverlay } from './useUploadDragDropOverlay';

import './UploadDragDrop.scss';

interface UploadDragDropProps {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onDrop: (dataTransfer: DataTransfer) => void;
}

export const UploadDragDrop = ({ children, className, disabled, onDrop }: UploadDragDropProps) => {
    const { isOverlayVisible, handleDragOver, handleDragLeave } = useUploadDragDropOverlay(!disabled);

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
            data-testid="drag-and-drop-upload"
        >
            <img className="visibility-hidden absolute h-0 w-0" src={dragdropImageSvg} alt="" aria-hidden="true" />
            {children}
            {isOverlayVisible && (
                <div
                    className="upload-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={(e) => {
                        if (e.dataTransfer) {
                            void onDrop(e.dataTransfer);
                        }
                    }}
                >
                    <section className="upload-drag-drop-infobox p-14 pt-11">
                        <img className="upload-drag-drop-image" src={dragdropImageSvg} alt="" aria-hidden="true" />
                        <h2 className="text-bold mt-4 mb-0">{c('Title').t`Drop to upload`}</h2>
                        <p className="mt-4 mb-0">{c('Info').t`Your files will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </div>
    );
};
