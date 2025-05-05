import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { DropdownMenuButton, Icon, ToolbarButton, useActiveBreakpoint } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export interface PhotosAddAlbumPhotosButtonProps {
    onClick: () => void;
    type?: 'toolbar' | 'norm' | 'dropdown';
}

export const PhotosAddAlbumPhotosButton = ({ onClick, type = 'norm' }: PhotosAddAlbumPhotosButtonProps) => {
    const { viewportWidth } = useActiveBreakpoint();

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                onClick={onClick}
                data-testid="toolbar-add-to-album"
                title={c('Action').t`Add photos`}
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name="plus" className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`Add photos`}</span>
            </ToolbarButton>
        );
    }
    if (type === 'dropdown') {
        return (
            <DropdownMenuButton
                data-testid="dropdown-add-to-album"
                className="text-left flex items-center flex-nowrap"
                onClick={onClick}
            >
                <Icon name="plus" className="mr-2" />
                <span>{c('Action').t`Add photos`}</span>
            </DropdownMenuButton>
        );
    }
    return (
        <Button
            color="norm"
            shape="solid"
            size="small"
            onClick={onClick}
            data-testid="toolbar-add-to-album"
            title={c('Action').t`Add photos`}
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="plus" className="mr-2" />
            <span>{c('Action').t`Add photos`}</span>
        </Button>
    );
};
