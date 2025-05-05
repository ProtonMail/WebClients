import type { FC } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props {
    onSavePhotos: () => Promise<void>;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

export const PhotosSavePhotoButton: FC<Props> = ({ onSavePhotos, showIconOnly, dropDownMenuButton = false }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        withLoading(onSavePhotos()).catch(noop);
    };

    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <ButtonComp
            title={c('Action').t`Save`}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-save-photo"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="cloud" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Save`}</span>
        </ButtonComp>
    );
};
