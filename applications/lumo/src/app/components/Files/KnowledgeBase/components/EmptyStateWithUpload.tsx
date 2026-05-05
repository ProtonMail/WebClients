import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { Message } from '../../../../types';
import { FileUploadButton } from '../../../Common';
import { useFileHandling } from '../../../Composer/hooks/useFileHandling';

interface EmptyStateWithUploadProps {
    messageChain: Message[];
    onShowDriveBrowser: () => void;
    spaceId?: string;
    className?: string;
}

export const EmptyStateWithUpload = ({
    messageChain,
    onShowDriveBrowser,
    spaceId,
    className,
}: EmptyStateWithUploadProps) => {
    // Use the standard file handling hook for consistent behavior
    const { handleFilesSelected } = useFileHandling({
        messageChain,
        onShowDriveBrowser,
        spaceId,
        uploadToDrive: undefined, // Local uploads only for now
    });

    return (
        <div
            className={clsx('flex flex-1 flex-column items-center justify-center text-center h-full gap-4', className)}
        >
            <Button
                shape="outline"
                onClick={onShowDriveBrowser}
                className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                title={c('collider_2025: Info').t`Add from ${DRIVE_SHORT_APP_NAME}`}
            >
                <IcBrandProtonDrive size={4} />
                <span>{c('collider_2025: Info').t`Add from ${DRIVE_SHORT_APP_NAME}`}</span>
            </Button>
            <FileUploadButton
                onFilesSelected={handleFilesSelected}
                shape="outline"
                className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                title={c('collider_2025: Info').t`Add from computer`}
            >
                <IcArrowUpLine size={4} />
                <span>{c('collider_2025: Info').t`Add from computer`}</span>
            </FileUploadButton>
        </div>
    );
};
