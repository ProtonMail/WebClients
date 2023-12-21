import { type VFC } from 'react';

import { type IconName } from '@proton/components/components';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { isPassIcon } from '@proton/pass/types/data/pass-icon';

export type DropdownItemIconProps = { url: string; icon: IconName } | { url?: never; icon: DropdownIcon };

export const DropdownItemIcon: VFC<DropdownItemIconProps> = ({ url, icon }) =>
    isPassIcon(icon) ? (
        <IconBox size={20} mode="transparent">
            <PassIcon status={icon} size={24} className="absolute-center" />
        </IconBox>
    ) : (
        <ItemIcon url={url} icon={icon} size={20} alt="" />
    );
