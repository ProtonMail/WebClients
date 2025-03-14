import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';

export interface PhotosAlbumShareButtonProps {
    onClick: () => void;
}

export const PhotosAlbumShareButton = ({ onClick }: PhotosAlbumShareButtonProps) => (
    <ToolbarButton
        onClick={onClick}
        data-testid="toolbar-share-album"
        title={c('Action').t`Share`}
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="user-plus" className="mr-2" alt={c('Action').t`Share`} />
        {c('Action').t`Share`}
    </ToolbarButton>
);
