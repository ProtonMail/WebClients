import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';

import { useFileUploadInput } from '../../../../store';

interface Props {
    shareId: string;
    linkId: string;
}
export const PhotosUploadButton: FC<Props> = ({ shareId, linkId }) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(shareId, linkId, true);

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
            <ToolbarButton
                onClick={handleClick}
                icon={<Icon name="file-arrow-in-up" alt={c('Action').t`Upload photos`} />}
                data-testid="toolbar-photos-upload"
                title={c('Action').t`Upload photos`}
            />
        </>
    );
};
