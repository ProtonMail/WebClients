import { type FC } from 'react';

import { type IconName } from '@proton/components';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { isPassIcon } from '@proton/pass/types/data/pass-icon';

export type ListItemIconProps = { url: string; icon: IconName } | { url?: never; icon: DropdownIcon };

export const ListItemIcon: FC<ListItemIconProps> = ({ url, icon }) =>
    isPassIcon(icon) ? (
        <IconBox size={5} mode="transparent">
            <PassIcon status={icon} size={6} className="absolute inset-center" />
        </IconBox>
    ) : (
        <ItemIcon url={url} icon={icon} size={5} alt="" />
    );
