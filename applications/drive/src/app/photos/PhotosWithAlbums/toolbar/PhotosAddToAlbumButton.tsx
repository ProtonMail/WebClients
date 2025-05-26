import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface PhotosAddToAlbumButtonProps {
    onClick: () => void;
    showIconOnly: boolean;
}

export const PhotosAddToAlbumButton = ({ onClick, showIconOnly }: PhotosAddToAlbumButtonProps) => (
    <ToolbarButton
        title={c('Action').t`Add to album`}
        onClick={onClick}
        data-testid="toolbar-add-to-album"
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="plus-circle" className={clsx(!showIconOnly && 'mr-2')} />
        <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Add to album`}</span>
    </ToolbarButton>
);
