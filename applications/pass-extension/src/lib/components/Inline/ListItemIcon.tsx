import type { FC, ReactNode } from 'react';

import type { IconName } from '@proton/icons/types';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import type { PassIconStatus } from '@proton/pass/types/data/pass-icon';

export type ListItemIconProps =
    | { type: 'icon'; url?: string; icon: IconName; customIcon?: ReactNode }
    | { type: 'status'; icon: PassIconStatus };

export const ListItemIcon: FC<ListItemIconProps> = (props) =>
    props.type === 'status' ? (
        <IconBox size={5} mode="transparent">
            <PassIcon status={props.icon} size={6} className="absolute inset-center" />
        </IconBox>
    ) : (
        <ItemIcon size={5} alt="" {...props} />
    );
