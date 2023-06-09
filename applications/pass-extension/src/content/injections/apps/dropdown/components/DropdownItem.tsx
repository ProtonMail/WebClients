import type { ReactNode, VFC } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components/components';
import { DropdownMenuButton, Icon } from '@proton/components/components';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export const DROPDOWN_ITEM_HEIGHT = 60;

export const DropdownItem: VFC<{
    onClick?: () => void;
    title: string;
    subTitle: ReactNode;
    icon?: IconName;
    disabled?: boolean;
    autogrow?: boolean;
}> = ({ onClick, title, subTitle, icon, disabled, autogrow }) => (
    <DropdownMenuButton
        className="text-left h-custom"
        style={autogrow ? {} : { '--custom-height': `${DROPDOWN_ITEM_HEIGHT}px` }}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex flex-align-items-center py-1">
            {icon !== undefined ? (
                <Icon name={icon} className="mr-4 item-icon" size={24} color="#6D4AFF" />
            ) : (
                <div className="mr-4 w-custom text-align-center" style={{ '--width-custom': '24px' }}>
                    <img
                        src={'/assets/protonpass-icon-32.png'}
                        width={18}
                        height={18}
                        className="ml-1"
                        alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                    />
                </div>
            )}

            <div className="flex-item-fluid">
                <span className="block text-ellipsis">{title}</span>
                <span className={clsx('block color-weak text-sm', !autogrow && 'text-ellipsis')}>{subTitle}</span>
            </div>
        </div>
    </DropdownMenuButton>
);
