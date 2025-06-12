import type { FC } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props {
    onSelectCover: () => Promise<void>;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

export const PhotosMakeCoverButton: FC<Props> = ({ onSelectCover, showIconOnly, dropDownMenuButton = false }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        withLoading(onSelectCover()).catch(noop);
    };

    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <ButtonComp
            title={c('Action').t`Set as cover`}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-set-as-cover"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="window-image" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Set as cover`}</span>
        </ButtonComp>
    );
};
