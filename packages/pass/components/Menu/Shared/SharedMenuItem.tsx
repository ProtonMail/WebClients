import { memo } from 'react';

import { c, msgid } from 'ttag';

import { type IconName } from '@proton/components/components/icon/Icon';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getInitialFilters, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import type { UpsellRef } from '@proton/pass/constants';
import { pipe } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    count: number;
    /** dense is for extension - by default renders
     * the `SharedMenuItem` as a vault submenu item. */
    dense?: boolean;
    icon: IconName;
    label?: string;
    selected: boolean;
    to: string;
    upsellRef?: UpsellRef;
    onAction?: () => void;
};

export const SharedMenuItem = memo(({ to, count, dense, selected, label, icon, upsellRef, onAction = noop }: Props) => {
    const navigate = useNavigate();
    const upsell = useUpselling();

    const onSelect = upsellRef
        ? () => upsell({ type: 'pass-plus', upsellRef })
        : () => navigate(getLocalPath(to), { filters: getInitialFilters() });

    return (
        <DropdownMenuButton
            onClick={pipe(() => !selected && onSelect(), onAction)}
            label={
                <div>
                    <div className="text-ellipsis">{label}</div>
                    <div className="color-weak">
                        {c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </div>
                </div>
            }
            parentClassName={clsx('w-full', !dense && 'pass-vault-submenu-vault-item ')}
            className={clsx(selected && 'is-selected', dense ? 'pt-1.5 pb-1.5' : 'py-2')}
            icon={<VaultIcon className="shrink-0" icon={icon} size={4} background />}
        />
    );
});

SharedMenuItem.displayName = 'SharedMenuItemMemo';
