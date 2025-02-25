import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';

import { type OnFileUploadSuccessCallbackData, useFileUploadInput } from '../../../store';

interface PhotosUploadButtonProps {
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
}
export const PhotosUploadButton: FC<PhotosUploadButtonProps> = ({ shareId, linkId, onFileUpload }) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(shareId, linkId, true);

    return (
        <>
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => {
                    handleChange(e, onFileUpload);
                }}
                accept={PHOTOS_ACCEPTED_INPUT}
            />
            <ToolbarButton
                onClick={handleClick}
                data-testid="toolbar-photos-upload"
                title={c('Action').t`Upload photos`}
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name="plus" className="mr-2" /> {c('Action').t`Upload photos`}
            </ToolbarButton>
        </>
    );
};
