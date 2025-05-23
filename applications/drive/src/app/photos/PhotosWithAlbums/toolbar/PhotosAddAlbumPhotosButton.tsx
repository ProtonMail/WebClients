import { c } from 'ttag';

import { Button, type ButtonLikeSize } from '@proton/atoms';
import { DropdownMenuButton, Icon, ToolbarButton, useActiveBreakpoint } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface PhotosAddAlbumPhotosButtonProps {
    onClick: () => void;
    buttonSize?: ButtonLikeSize;
    type?: 'toolbar' | 'norm' | 'dropdown';
}

export const PhotosAddAlbumPhotosButton = ({
    onClick,
    buttonSize = 'small',
    type = 'norm',
}: PhotosAddAlbumPhotosButtonProps) => {
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
            size={buttonSize}
            onClick={onClick}
            data-testid="add-to-album"
            title={c('Action').t`Add photos`}
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="plus" className="mr-2" />
            <span>{c('Action').t`Add photos`}</span>
        </Button>
    );
};
