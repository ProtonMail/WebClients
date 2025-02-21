import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';

export interface PhotosAddToAlbumButtonProps {
    onClick: () => void;
}

export const PhotosAddAlbumPhotosButton = ({ onClick }: PhotosAddToAlbumButtonProps) => (
    <ToolbarButton
        title={c('Action').t`Add to album`}
        onClick={onClick}
        data-testid="toolbar-details"
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="plus" className="mr-2" /> {c('Action').t`Add to album`}
    </ToolbarButton>
);
