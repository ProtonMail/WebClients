import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface PhotosShareMultipleLinkButtonProps {
    onClick: () => void;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

export const PhotosShareMultipleLinkButton = ({
    onClick,
    showIconOnly,
    dropDownMenuButton = false,
}: PhotosShareMultipleLinkButtonProps) => {
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            title={c('Action').t`Share`}
            onClick={onClick}
            data-testid="toolbar-share-multiple"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="user-plus" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Share`}</span>
        </ButtonComp>
    );
};
