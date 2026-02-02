import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
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
        <IcUserPlus className={clsx(!showIconOnly && 'mr-2')} alt={c('Action').t`Share`} />
        <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Share`}</span>
    </ToolbarButton>
);
