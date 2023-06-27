import type { ReactNode, VFC } from 'react';

import { DropdownMenuButton } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import type { DropdownItemIconProps } from './DropdownItemIcon';
import { DropdownItemIcon } from './DropdownItemIcon';

export const DROPDOWN_ITEM_HEIGHT = 60;

export const DropdownItem: VFC<
    {
        onClick?: () => void;
        title?: string;
        subTitle: ReactNode;
        disabled?: boolean;
        autogrow?: boolean;
        /* FIXME once theming is implemented: rename className prop to
         * itemType or similar and automatically derive the className
         * using something similar to itemTypeToItemClassName[itemType] */
        className?: 'ui-login' | 'ui-alias' | 'ui-password';
    } & DropdownItemIconProps
> = ({ onClick, title, subTitle, icon, url, disabled, autogrow, className = 'ui-login' }) => (
    <DropdownMenuButton
        className={clsx('text-left h-custom', className)}
        style={autogrow ? {} : { '--h-custom': `${DROPDOWN_ITEM_HEIGHT}px` }}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex flex-align-items-center py-1 gap-3">
            <DropdownItemIcon {...(url ? { url, icon } : { icon })} />
            <div className="flex-item-fluid">
                {title && <span className="block text-ellipsis">{title}</span>}
                <span className={clsx('block color-weak text-sm', !autogrow && 'text-ellipsis')}>{subTitle}</span>
            </div>
        </div>
    </DropdownMenuButton>
);
