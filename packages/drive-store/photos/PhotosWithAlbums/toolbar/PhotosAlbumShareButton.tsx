import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface PhotosAlbumShareButtonProps {
    onClick: () => void;
    showIconOnly: boolean;
}

export const PhotosAlbumShareButton = ({ onClick, showIconOnly }: PhotosAlbumShareButtonProps) => (
    <ToolbarButton
        onClick={onClick}
        data-testid="toolbar-share-album"
        title={c('Action').t`Share`}
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="user-plus" className={clsx(!showIconOnly && 'mr-2')} alt={c('Action').t`Share`} />
        <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Share`}</span>
    </ToolbarButton>
);
