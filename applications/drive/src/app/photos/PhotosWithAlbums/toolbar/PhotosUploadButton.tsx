import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, ToolbarButton, useActiveBreakpoint } from '@proton/components';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import {
    type OnFileSkippedSuccessCallbackData,
    type OnFileUploadSuccessCallbackData,
    useFileUploadInput,
} from '../../../store';

interface PhotosUploadButtonProps {
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    type?: 'toolbar' | 'norm';
    isAddAlbumPhotosView?: boolean;
    isAlbumUpload?: boolean;
}
export const PhotosUploadButton: FC<PhotosUploadButtonProps> = ({
    shareId,
    linkId,
    onFileUpload,
    onFileSkipped,
    type = 'toolbar',
    isAddAlbumPhotosView,
    isAlbumUpload,
}) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(shareId, linkId, true);

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
                    handleChange(e, onFileUpload, onFileSkipped);
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
                    <Icon
                        name={isAlbumUpload ? 'plus-circle' : 'plus'}
                        className={clsx(!viewportWidth.xsmall && 'mr-2')}
                    />
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{uploadLabel}</span>
                </ToolbarButton>
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
                    <Icon name="plus" className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{uploadLabel}</span>
                </Button>
            )}
        </>
    );
};
