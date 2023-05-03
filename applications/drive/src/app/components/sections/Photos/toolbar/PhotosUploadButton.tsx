import { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/components';

export const PhotosUploadButton: FC = () => {
    const handleClick = (): void => {};

    return (
        <ToolbarButton
            onClick={handleClick}
            icon={<Icon name="file-arrow-in-up" alt={c('Action').t`Upload photos`} />}
            data-testid="toolbar-photos-upload"
            title={c('Action').t`Upload photos`}
        />
    );
};
