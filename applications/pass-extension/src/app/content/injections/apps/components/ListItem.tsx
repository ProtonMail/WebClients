import type { FC, ReactNode } from 'react';

import { DropdownMenuButton } from '@proton/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import clsx from '@proton/utils/clsx';

import { ListItemIcon, type ListItemIconProps } from './ListItemIcon';

import './ListItem.scss';

export const LIST_ITEM_HEIGHT = 3.75; /* rem */

export const ListItem: FC<
    {
        autogrow?: boolean;
        className?: string;
        disabled?: boolean;
        subTheme?: SubTheme;
        subTitle: ReactNode;
        title?: string;
        onClick?: () => void;
    } & ListItemIconProps
> = ({ onClick, className, title, subTitle, icon, url, disabled, autogrow, subTheme = SubTheme.VIOLET }) => (
    <DropdownMenuButton
        className={clsx(
            'pass-injected-dropdown--item text-left',
            autogrow ? 'min-h-custom' : 'h-custom',
            subTheme,
            className
        )}
        style={autogrow ? { '--min-h-custom': `${LIST_ITEM_HEIGHT}rem` } : { '--h-custom': `${LIST_ITEM_HEIGHT}rem` }}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex items-center gap-3">
            <ListItemIcon {...(url ? { url, icon } : { icon })} />
            <div className="flex-1">
                {title && <span className="block text-ellipsis">{title}</span>}
                <span
                    className={clsx(
                        'pass-injected-dropdown--subtitle block color-weak text-sm',
                        !autogrow && 'text-ellipsis'
                    )}
                >
                    {subTitle}
                </span>
            </div>
        </div>
    </DropdownMenuButton>
);
