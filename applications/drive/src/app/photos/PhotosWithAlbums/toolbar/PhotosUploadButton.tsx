import type { FC } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownMenuButton, ToolbarButton, useActiveBreakpoint } from '@proton/components';
import { uploadManager } from '@proton/drive/modules/upload';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import { useAlbumPhotoUploadSDKStore } from '../../PhotosStore/useAlbumPhotoUploadSDK.store';

interface PhotosUploadButtonProps {
    type?: 'toolbar' | 'norm' | 'dropdown';
    albumNodeUid: string | undefined;
    onUploadStart?: () => void;
    label?: string;
}

export const PhotosUploadButton: FC<PhotosUploadButtonProps> = ({
    type = 'toolbar',
    albumNodeUid,
    onUploadStart,
    label,
}) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { viewportWidth } = useActiveBreakpoint();
    const isAlbumUpload = Boolean(albumNodeUid);

    const handleClick = () => {
        if (fileInput.current) {
            fileInput.current.value = '';
            fileInput.current.click();
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!files) {
            return;
        }
        onUploadStart?.();
        const queuedUploadIds = await uploadManager.uploadPhotos(files);
        if (albumNodeUid && queuedUploadIds.length > 0) {
            queuedUploadIds.forEach((uploadId) => {
                useAlbumPhotoUploadSDKStore.getState().setContext(uploadId, albumNodeUid);
            });
        }
    };

    const uploadLabel = label ?? (isAlbumUpload ? c('Action').t`Add photos` : c('Action').t`Upload photos`);

    return (
        <>
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={handleChange}
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
                    color="norm"
                    shape="solid"
                    size="small"
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
