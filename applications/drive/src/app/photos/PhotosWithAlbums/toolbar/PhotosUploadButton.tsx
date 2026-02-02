import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownMenuButton, ToolbarButton, useActiveBreakpoint } from '@proton/components';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import {
    type OnFileSkippedSuccessCallbackData,
    type OnFileUploadSuccessCallbackData,
    useFileUploadInput,
} from '../../../store';

interface PhotosUploadButtonProps {
    volumeId: string;
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onStartUpload?: () => void;
    type?: 'toolbar' | 'norm' | 'dropdown';
    isAddAlbumPhotosView?: boolean;
    isAlbumUpload?: boolean;
}
export const PhotosUploadButton: FC<PhotosUploadButtonProps> = ({
    volumeId,
    shareId,
    linkId,
    onFileUpload,
    onFileSkipped,
    onStartUpload,
    type = 'toolbar',
    isAddAlbumPhotosView,
    isAlbumUpload,
}) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(volumeId, shareId, linkId, true);

    const { viewportWidth } = useActiveBreakpoint();

    let uploadLabel;
    if (isAddAlbumPhotosView) {
        uploadLabel = c('Action').t`Upload from computer`;
    } else if (isAlbumUpload) {
        uploadLabel = c('Action').t`Add photos`;
    } else {
        uploadLabel = c('Action').t`Upload photos`;
    }

    return (
        <>
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => {
                    onStartUpload?.();
                    void handleChange(e, onFileUpload, onFileSkipped);
                }}
                accept={PHOTOS_ACCEPTED_INPUT}
            />
            {type === 'toolbar' && (
                <ToolbarButton
                    onClick={handleClick}
                    data-testid="toolbar-photos-upload"
                    title={uploadLabel}
                    className="inline-flex flex-nowrap flex-row items-center"
                >
                    {isAlbumUpload ? (
                        <IcPlusCircle className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                    ) : (
                        <IcPlus className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                    )}
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{uploadLabel}</span>
                </ToolbarButton>
            )}
            {type === 'dropdown' && (
                <DropdownMenuButton
                    data-testid="dropdown-photos-upload"
                    className="text-left flex items-center flex-nowrap"
                    onClick={handleClick}
                >
                    {isAlbumUpload ? <IcPlusCircle className="mr-2" /> : <IcPlus className="mr-2" />}
                    <span className="sr-only">{uploadLabel}</span>
                </DropdownMenuButton>
            )}
            {type === 'norm' && (
                <Button
                    onClick={handleClick}
                    data-testid="norm-photos-upload"
                    color={isAddAlbumPhotosView ? 'weak' : 'norm'}
                    shape={isAddAlbumPhotosView ? 'ghost' : 'solid'}
                    size={isAddAlbumPhotosView ? 'medium' : 'small'}
                    icon={viewportWidth.xsmall}
                    title={uploadLabel}
                    className="inline-flex flex-row flex-nowrap items-center"
                >
                    <IcPlus className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{uploadLabel}</span>
                </Button>
            )}
        </>
    );
};
