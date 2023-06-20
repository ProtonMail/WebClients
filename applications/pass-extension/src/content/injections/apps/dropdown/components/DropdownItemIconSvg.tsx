import type { VFC } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { PassIcon } from '@proton/pass/types/data/pass-icon';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import '../../../../../popup/components/Item/ItemIcon.scss';

export const DropdownItemIconSvg: VFC<{
    icon: DropdownIcon;
    size?: number;
    className?: string;
}> = ({ icon, size = 36, className }) => {
    const passIconAsset = Object.values<DropdownIcon>(PassIcon).includes(icon) ? `/assets/${icon}.svg` : null;

    return passIconAsset ? (
        <div
            className={clsx('w-custom h-custom text-align-center', className)}
            style={{ '--width-custom': `${size}px`, '--height-custom': `${size}px` }}
        >
            <img
                src={passIconAsset}
                width={size}
                height={size}
                className="p-1"
                alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
            />
        </div>
    ) : (
        <div
            className={clsx('pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative', className)}
            style={{ '--width-custom': `${size}px`, '--height-custom': `${size}px` }}
        >
            <Icon className="absolute-center" name={icon as IconName} size={20} color="var(--interaction-norm)" />
        </div>
    );
};
