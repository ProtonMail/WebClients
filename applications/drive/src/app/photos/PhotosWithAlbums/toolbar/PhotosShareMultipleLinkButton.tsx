import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export interface PhotosShareMultipleLinkButtonProps {
    onClick: () => void;
    showIconOnly: boolean;
}

export const PhotosShareMultipleLinkButton = ({ onClick, showIconOnly }: PhotosShareMultipleLinkButtonProps) => (
    <ToolbarButton
        title={c('Action').t`Share`}
        onClick={onClick}
        data-testid="toolbar-share-multiple"
        className="inline-flex flex-nowrap flex-row items-center"
    >
        <Icon name="user-plus" className={clsx(!showIconOnly && 'mr-2')} />
        <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Share`}</span>
    </ToolbarButton>
);
