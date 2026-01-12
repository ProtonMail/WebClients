import React from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';

export interface UploadProgress {
    fileName: string;
    progress: number;
    isProcessing?: boolean;
}

interface UploadProgressOverlayProps {
    uploadProgress: UploadProgress;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
    uploadProgress,
}) => {
    const progressPercent = Math.round(uploadProgress.progress);
    
    return (
        <div className="px-3 py-2 bg-weak rounded mb-2">
            <div className="flex items-center gap-2">
                {uploadProgress.isProcessing ? (
                    <Icon name="checkmark" className="color-success flex-shrink-0" />
                ) : (
                    <div className="animate-spin rounded-full w-4 h-4 border-2 border-primary border-t-transparent flex-shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm m-0 text-ellipsis overflow-hidden whitespace-nowrap">
                        {uploadProgress.isProcessing
                            ? c('collider_2025: Info').t`Processing ${uploadProgress.fileName}`
                            : c('collider_2025: Info').t`Uploading ${uploadProgress.fileName}`
                        }
                    </p>
                </div>
                {!uploadProgress.isProcessing && (
                    <span className="text-xs color-weak flex-shrink-0">{progressPercent}%</span>
                )}
            </div>
            {!uploadProgress.isProcessing && (
                <div 
                    className="mt-2 rounded-full overflow-hidden"
                    style={{ height: '4px', backgroundColor: 'var(--border-norm)' }}
                >
                    <div
                        className="bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.progress}%`, height: '4px' }}
                    />
                </div>
            )}
        </div>
    );
}; 