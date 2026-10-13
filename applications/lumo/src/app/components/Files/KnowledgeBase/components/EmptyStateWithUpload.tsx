import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../../../hooks/useLumoFlags';
import type { Message } from '../../../../types';
import { FileUploadButton } from '../../../Common';
import { useFileHandling } from '../../../Composer/hooks/useFileHandling';
import { LumoIcon } from '../../../LumoIcon/LumoIcon';
import type { IconName } from '../../../LumoIcon/LumoIcon';

interface EmptyTile {
    icon: IconName;
    rotation: number;
    highlighted?: boolean;
}

// Three tiles fanned out: file, upload (the action, so highlighted and in front), Drive folder.
const EMPTY_STATE_TILES: EmptyTile[] = [
    { icon: 'FileText', rotation: -8 },
    { icon: 'ArrowUpToLine', rotation: 0, highlighted: true },
    { icon: 'Folder', rotation: 8 },
];

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
    const { artifactsView: isArtifactsViewFlagEnabled } = useLumoFlags();

    if (!isArtifactsViewFlagEnabled) {
        return (
            <div
                className={clsx(
                    'flex flex-1 flex-column items-center justify-center text-center h-full gap-4',
                    className
                )}
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
                    <LumoIcon name="ArrowUpToLine" size={16} />
                    <span>{c('collider_2025: Info').t`Add from computer`}</span>
                </FileUploadButton>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                'flex flex-1 flex-column items-center justify-center text-center h-full gap-4 px-4',
                className
            )}
        >
            <div className="flex flex-row flex-nowrap items-center justify-center gap-1 mb-2" aria-hidden="true">
                {EMPTY_STATE_TILES.map((tile) => {
                    return (
                        <span
                            key={tile.icon}
                            className="flex items-center justify-center bg-norm border border-weak rounded-lg shadow-raised w-custom h-custom"
                            style={{
                                '--w-custom': '3rem',
                                '--h-custom': '3rem',
                                transform: `rotate(${tile.rotation}deg)`,
                            }}
                        >
                            <LumoIcon
                                name={tile.icon}
                                size={20}
                                className={tile.highlighted ? 'color-primary' : 'color-weak'}
                            />
                        </span>
                    );
                })}
            </div>
            <div className="flex flex-column gap-2">
                <h3 className="m-0 text-lg text-bold">{c('collider_2025: Info').t`No files or artifacts yet`}</h3>
                <p className="m-0 color-weak">
                    {c('collider_2025: Info')
                        .t`Upload files or add them from ${DRIVE_APP_NAME} to give ${LUMO_SHORT_APP_NAME} context. ${LUMO_SHORT_APP_NAME} generated Artifacts in this chat will appear here.`}
                </p>
            </div>
            <div className="flex flex-row flex-wrap items-center justify-center gap-2">
                <FileUploadButton
                    onFilesSelected={handleFilesSelected}
                    shape="outline"
                    className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                    title={c('collider_2025: Info').t`Upload from your computer`}
                >
                    <LumoIcon name="ArrowUpToLine" size={16} />
                    <span>{c('collider_2025: Action').t`Upload`}</span>
                </FileUploadButton>
                <Button
                    shape="outline"
                    onClick={onShowDriveBrowser}
                    className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                    title={c('collider_2025: Info').t`Add from ${DRIVE_SHORT_APP_NAME}`}
                >
                    <IcBrandProtonDrive size={4} />
                    <span>{c('collider_2025: Action').t`Add from ${DRIVE_SHORT_APP_NAME}`}</span>
                </Button>
            </div>
        </div>
    );
};
