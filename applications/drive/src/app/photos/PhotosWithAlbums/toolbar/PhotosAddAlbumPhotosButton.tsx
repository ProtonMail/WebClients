import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export interface PhotosAddToAlbumButtonProps {
    onClick: () => void;
    showIconOnly: boolean;
}

export const PhotosAddAlbumPhotosButton = ({ onClick, showIconOnly }: PhotosAddToAlbumButtonProps) => (
    <ToolbarButton
        title={c('Action').t`Add to album`}
        onClick={onClick}
        data-testid="toolbar-details"
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="plus" className={clsx(!showIconOnly && 'mr-2')} />
        <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Add to album`}</span>
    </ToolbarButton>
);
