import { type VFC } from 'react';

import { type IconName } from '@proton/components/components';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { isPassIcon } from '@proton/pass/types/data/pass-icon';

import { IconBox } from '../../../../../shared/components/icon/IconBox';
import { BaseItemIcon } from '../../../../../shared/components/icon/ItemIcon';
import { PassIcon } from '../../../../../shared/components/icon/PassIcon';

export type DropdownItemIconProps = { url: string; icon: IconName } | { url?: never; icon: DropdownIcon };

export const DropdownItemIcon: VFC<DropdownItemIconProps> = ({ url, icon }) =>
    isPassIcon(icon) ? (
        <IconBox size={20} mode="transparent">
            <PassIcon status={icon} size={24} className="absolute-center" />
        </IconBox>
    ) : (
        <BaseItemIcon url={url} icon={icon} size={20} alt="" />
    );
