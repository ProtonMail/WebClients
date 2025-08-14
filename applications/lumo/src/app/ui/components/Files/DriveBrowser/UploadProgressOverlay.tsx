import React from 'react';

import { c } from 'ttag';

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
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3 mx-auto"></div>
                <p className="text-sm font-medium mb-1">
                    {uploadProgress.isProcessing
                        ? c('collider_2025: Info').t`Processing ${uploadProgress.fileName}`
                        : c('collider_2025: Info').t`Uploading ${uploadProgress.fileName}`
                    }
                </p>
                {!uploadProgress.isProcessing && (
                    <>
                        <div className="w-64 bg-weak rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{width: `${uploadProgress.progress}%`}}
                            ></div>
                        </div>
                        <p className="text-xs text-weak mt-1">
                            {Math.round(uploadProgress.progress)}%
                        </p>
                    </>
                )}
                {uploadProgress.isProcessing && (
                    <p className="text-xs text-weak mt-1">
                        {c('collider_2025: Info').t`Adding to knowledge base...`}
                    </p>
                )}
            </div>
        </div>
    );
}; 