import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';

export interface PhotosAddToAlbumButtonProps {
    onClick: () => void;
}

export const PhotosAddAlbumPhotosButton = ({ onClick }: PhotosAddToAlbumButtonProps) => (
    <ToolbarButton
        title={c('Action').t`Add to album`}
        icon={<Icon name="plus" alt={c('Action').t`Add to album`} />}
        onClick={onClick}
        data-testid="toolbar-details"
    />
);
