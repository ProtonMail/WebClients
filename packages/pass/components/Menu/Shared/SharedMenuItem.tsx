import { memo } from 'react';

import { c, msgid } from 'ttag';

import { type IconName } from '@proton/components/components/icon/Icon';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getInitialFilters, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    count: number;
    icon: IconName;
    label?: string;
    selected: boolean;
    subLabel?: string;
    to: string;
    onAction?: () => void;
};

export const SharedMenuItem = memo(({ to, count, selected, label, subLabel, icon, onAction = noop }: Props) => {
    const navigate = useNavigate();
    const onSelect = () => navigate(getLocalPath(to), { filters: omit(getInitialFilters(), ['search']) });

    return (
        <DropdownMenuButton
            onClick={pipe(() => !selected && onSelect(), onAction)}
            label={
                <div>
                    <div className="text-ellipsis">{label}</div>
                    <div className="text-ellipsis color-weak">
                        {subLabel ? subLabel : c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </div>
                </div>
            }
            parentClassName="w-full pass-vault-submenu-vault-item"
            className={clsx(selected && 'is-selected', 'pl-2 pr-2')}
            icon={<VaultIcon className="shrink-0 mr-1" icon={icon} size={4} background />}
        />
    );
});

SharedMenuItem.displayName = 'SharedMenuItemMemo';
