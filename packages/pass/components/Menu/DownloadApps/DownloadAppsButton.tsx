import type { FC } from 'react';

import { c } from 'ttag';

import { IcMobile } from '@proton/icons/icons/IcMobile';

import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';

type Props = {
    onAction?: () => void;
    openModal: () => void;
    parentClassName?: string;
    className?: string;
};

export const DownloadAppsButton: FC<Props> = ({
    onAction,
    openModal,
    parentClassName = 'mx-3',
    className = 'rounded',
}) => {
    const label = DESKTOP_BUILD
        ? c('Action').t`Get mobile apps`
        : // translator: if the translated text is longer than the english text,
          // please simply translate as "Get apps" because UI space is limited.
          c('Action').t`Get mobile and desktop apps`;

    const handleClick = () => {
        openModal();
        onAction?.();
    };

    return (
        <DropdownMenuButton
            icon={IcMobile}
            label={label}
            onClick={handleClick}
            parentClassName={parentClassName}
            className={className}
        />
    );
};
