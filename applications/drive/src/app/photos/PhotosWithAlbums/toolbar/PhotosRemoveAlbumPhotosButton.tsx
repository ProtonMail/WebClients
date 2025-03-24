import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

export const PhotosRemoveAlbumPhotosButton = ({
    onClick,
    showIconOnly,
    dropDownMenuButton = false,
}: {
    onClick: () => Promise<void>;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}) => {
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            className="inline-flex flex-nowrap flex-row items-center"
            onClick={onClick}
            title={c('Action').t`Remove from album`}
            data-testid="toolbar-remove-album-photos"
        >
            <Icon className={clsx(!showIconOnly && 'mr-2')} name="trash" />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Remove from album`}</span>
        </ButtonComp>
    );
};
