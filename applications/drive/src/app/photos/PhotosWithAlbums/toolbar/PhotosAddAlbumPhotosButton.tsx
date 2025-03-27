import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon, ToolbarButton, useActiveBreakpoint } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export interface PhotosAddAlbumPhotosButtonProps {
    onClick: () => void;
    type?: 'toolbar' | 'norm';
}

export const PhotosAddAlbumPhotosButton = ({ onClick, type = 'norm' }: PhotosAddAlbumPhotosButtonProps) => {
    const { viewportWidth } = useActiveBreakpoint();

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                onClick={onClick}
                data-testid="toolbar-photos-upload"
                title={c('Action').t`Add photos`}
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name="plus-circle" className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`Add photos`}</span>
            </ToolbarButton>
        );
    }
    return (
        <Button
            color="norm"
            shape="solid"
            size="small"
            onClick={onClick}
            data-testid="toolbar-album-add-photos"
            title={c('Action').t`Add photos`}
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="plus-circle" className="mr-2" />
            <span>{c('Action').t`Add photos`}</span>
        </Button>
    );
};
