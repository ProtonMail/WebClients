import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';

export const PhotosRemoveAlbumPhotosButton = ({ onClick }: { onClick: () => Promise<void> }) => {
    return (
        <ToolbarButton
            className="inline-flex flex-nowrap flex-row items-center"
            onClick={onClick}
            title={c('Action').t`Remove from album`}
            data-testid="toolbar-remove-album-photos"
        >
            <Icon className="mr-2" name="trash" />
            {c('Action').t`Remove from album`}
        </ToolbarButton>
    );
};
