import type { ReactNode, VFC } from 'react';

import { DropdownMenuButton } from '@proton/components/components';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import clsx from '@proton/utils/clsx';

import { DropdownItemIcon } from './DropdownItemIcon';

export const DROPDOWN_ITEM_HEIGHT = 60;

export const DropdownItem: VFC<{
    onClick?: () => void;
    title?: string;
    subTitle: ReactNode;
    icon?: DropdownIcon;
    url?: string;
    canLoadFavicons?: boolean;
    disabled?: boolean;
    autogrow?: boolean;
    /* FIXME once theming is implemented: rename className prop to itemType or similar
     * and automatically derive the className using something similar to itemTypeToItemClassName[itemType] */
    className?: 'ui-login' | 'ui-alias' | 'ui-password';
}> = ({ onClick, title, subTitle, icon, url, canLoadFavicons, disabled, autogrow, className = 'ui-login' }) => (
    <DropdownMenuButton
        className={clsx('text-left h-custom', className)}
        style={autogrow ? {} : { '--custom-height': `${DROPDOWN_ITEM_HEIGHT}px` }}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex flex-align-items-center py-1">
            <DropdownItemIcon icon={icon} url={url} canLoadFavicons={canLoadFavicons} className="mr-4" />
            <div className="flex-item-fluid">
                {title && <span className="block text-ellipsis">{title}</span>}
                <span className={clsx('block color-weak text-sm', !autogrow && 'text-ellipsis')}>{subTitle}</span>
            </div>
        </div>
    </DropdownMenuButton>
);
