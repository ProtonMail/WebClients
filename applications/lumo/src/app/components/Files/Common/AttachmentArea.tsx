import React from 'react';

import { c } from 'ttag';

import { LumoEyesSVG } from './LumoEyesSVG';

import './AttachmentArea.scss';

export type AttachmentAreaProps = {
    onDrop: (e: React.DragEvent) => void;
};

export function AttachmentArea({ onDrop }: AttachmentAreaProps) {
    return (
        <div className="droparea attachment-area-overlay flex flex-row lumoblur" onDrop={onDrop}>
            <div className="absolute inset-0 flex flex-column items-center text-center">
                <div className="flex flex-column flex-nowrap gap-4 my-auto lumo-color-glyph-mid">
                    <div className="flex flex-column flex-nowrap items-center">
                        <LumoEyesSVG />
                    </div>
                    <h1 className="mt-3 lumo-title-large">{c('collider_2025: Title').t`Upload files`}</h1>
                    <p className="m-0">{c('collider_2025: Info')
                        .t`Drag and drop your files here to add them to the chat.`}</p>
                </div>
            </div>
        </div>
    );
}
