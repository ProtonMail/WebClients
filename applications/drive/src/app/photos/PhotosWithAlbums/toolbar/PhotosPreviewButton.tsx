import type { FC } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    onClick: () => void;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

export const PhotosPreviewButton: FC<Props> = ({ onClick, showIconOnly, dropDownMenuButton = false }) => {
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            title={c('Action').t`Preview`}
            onClick={onClick}
            data-testid="toolbar-preview"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="eye" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Preview`}</span>
        </ButtonComp>
    );
};
