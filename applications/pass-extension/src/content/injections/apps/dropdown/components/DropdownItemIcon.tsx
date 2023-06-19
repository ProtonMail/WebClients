import type { VFC } from 'react';

import type { IconName } from '@proton/components/components';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';

import { DropdownItemIconDomain } from './DropdownItemIconDomain';
import { DropdownItemIconSvg } from './DropdownItemIconSvg';

import '../../../../../popup/components/Item/ItemIcon.scss';

export const ICON_SIZE = 36;

export const DropdownItemIcon: VFC<{
    icon: DropdownIcon;
    url?: string;
    className?: string;
}> = ({ icon, url, className }) => {
    return url ? (
        <DropdownItemIconDomain url={url} icon={icon as IconName} className={className} size={ICON_SIZE} />
    ) : (
        <DropdownItemIconSvg icon={icon} className={className} size={ICON_SIZE} />
    );
};
