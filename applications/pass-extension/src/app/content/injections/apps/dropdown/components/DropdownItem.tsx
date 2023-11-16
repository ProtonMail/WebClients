import type { ReactNode, VFC } from 'react';

import { DropdownMenuButton } from '@proton/components/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import clsx from '@proton/utils/clsx';

import { DropdownItemIcon, type DropdownItemIconProps } from './DropdownItemIcon';

import './DropdownItem.scss';

export const DROPDOWN_ITEM_HEIGHT = 3.75; /* rem */

export const DropdownItem: VFC<
    {
        onClick?: () => void;
        title?: string;
        subTitle: ReactNode;
        disabled?: boolean;
        autogrow?: boolean;
        subTheme?: SubTheme;
    } & DropdownItemIconProps
> = ({ onClick, title, subTitle, icon, url, disabled, autogrow, subTheme = SubTheme.VIOLET }) => (
    <DropdownMenuButton
        className={clsx('pass-injected-dropdown--item text-left min-h-custom h-custom', subTheme)}
        style={
            autogrow
                ? { '--min-h-custom': `${DROPDOWN_ITEM_HEIGHT}rem` }
                : { '--h-custom': `${DROPDOWN_ITEM_HEIGHT}rem` }
        }
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex flex-align-items-center gap-3">
            <DropdownItemIcon {...(url ? { url, icon } : { icon })} />
            <div className="flex-item-fluid">
                {title && <span className="block text-ellipsis">{title}</span>}
                <span
                    className={clsx(
                        'pass-injected-dropdown--subtitle block color-weak text-xs',
                        !autogrow && 'text-ellipsis'
                    )}
                >
                    {subTitle}
                </span>
            </div>
        </div>
    </DropdownMenuButton>
);
