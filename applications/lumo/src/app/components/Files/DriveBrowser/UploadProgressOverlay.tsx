import React from 'react';

import { c } from 'ttag';

import { LumoIcon } from '../../LumoIcon/LumoIcon';

export interface UploadProgress {
    fileName: string;
    progress: number;
    isProcessing?: boolean;
}

interface UploadProgressOverlayProps {
    uploadProgress: UploadProgress;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({ uploadProgress }) => {
    const progressPercent = Math.round(uploadProgress.progress);

    return (
        <div className="mb-2 px-3 py-2 radius-8 lumo-bg-notice">
            <div className="flex items-center gap-2">
                {uploadProgress.isProcessing ? (
                    <LumoIcon name="Check" className="flex-shrink-0 lumo-color-signal-success" />
                ) : (
                    <div className="flex-shrink-0 w-4 h-4 border-2 border-primary border-t-transparent radius-full animate-spin"></div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="whitespace-nowrap m-0 overflow-hidden lumo-body-small text-ellipsis">
                        {uploadProgress.isProcessing
                            ? c('collider_2025: Info').t`Processing ${uploadProgress.fileName}`
                            : c('collider_2025: Info').t`Uploading ${uploadProgress.fileName}`}
                    </p>
                </div>
                {!uploadProgress.isProcessing && (
                    <span className="flex-shrink-0 lumo-label-medium lumo-color-glyph-mid">{progressPercent}%</span>
                )}
            </div>
            {!uploadProgress.isProcessing && (
                <div
                    className="mt-2 overflow-hidden radius-full"
                    style={{ height: '4px', backgroundColor: 'var(--border-norm)' }}
                >
                    <div
                        className="duration-300 radius-full bg-primary transition-all lumo-easing-standard"
                        style={{ width: `${uploadProgress.progress}%`, height: '4px' }}
                    />
                </div>
            )}
        </div>
    );
};
