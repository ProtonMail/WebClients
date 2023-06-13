import type { ReactNode, VFC } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components/components';
import { DropdownMenuButton, Icon } from '@proton/components/components';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export const DROPDOWN_ITEM_HEIGHT = 60;

const renderIcon = (icon: IconName | 'proton-pass-locked' | 'proton-pass-inactive') => {
    switch (icon) {
        case 'proton-pass-locked':
            return (
                <div className="mr-4 w-custom text-align-center" style={{ '--width-custom': '32px' }}>
                    <img
                        src={'/assets/protonpass-icon-padding-locked-light.svg'}
                        width={32}
                        height={32}
                        className="ml-1"
                        alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                    />
                </div>
            );
        case 'proton-pass-inactive':
            return (
                <div className="mr-4 w-custom text-align-center" style={{ '--width-custom': '32px' }}>
                    <img
                        src={'/assets/protonpass-icon-padding-inactive.svg'}
                        width={32}
                        height={32}
                        className="ml-1"
                        alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                    />
                </div>
            );
        default:
            return <Icon name={icon} className="mr-4 item-icon" size={32} color="var(--interaction-norm)" />;
    }
};

export const DropdownItem: VFC<{
    onClick?: () => void;
    title?: string;
    subTitle: ReactNode;
    icon?: IconName | 'proton-pass-locked' | 'proton-pass-inactive';
    disabled?: boolean;
    removePointer?: boolean;
    autogrow?: boolean;
    className?: 'ui-login' | 'ui-alias' | 'ui-password';
}> = ({ onClick, title, subTitle, icon, disabled, removePointer, autogrow, className = 'ui-login' }) => (
    <DropdownMenuButton
        className={clsx('text-left h-custom', className, removePointer && 'cursor-default')}
        style={autogrow ? {} : { '--custom-height': `${DROPDOWN_ITEM_HEIGHT}px` }}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex flex-align-items-center py-1">
            {icon !== undefined ? (
                renderIcon(icon)
            ) : (
                <div className="mr-4 w-custom text-align-center" style={{ '--w-custom': '32px' }}>
                    <img
                        src={'/assets/protonpass-icon-padding.svg'}
                        width={32}
                        height={32}
                        className="ml-1"
                        alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                    />
                </div>
            )}

            <div className="flex-item-fluid">
                {title && <span className="block text-ellipsis">{title}</span>}
                <span className={clsx('block color-weak text-sm', !autogrow && 'text-ellipsis')}>{subTitle}</span>
            </div>
        </div>
    </DropdownMenuButton>
);
