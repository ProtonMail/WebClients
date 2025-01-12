import { memo } from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getInitialFilters, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
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
        : pipe(() => navigate(getLocalPath(to), { filters: getInitialFilters() }), onAction);

    return (
        <DropdownMenuButton
            onClick={() => !selected && onSelect()}
            label={<span className="block text-ellipsis">{label}</span>}
            parentClassName={clsx('w-full', !dense && 'pass-vault-submenu-vault-item ')}
            className={clsx(selected && 'is-selected', dense ? 'pt-1.5 pb-1.5' : 'py-3')}
            style={{ '--max-h-custom': '1.25rem' }}
            extra={<span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>}
            icon={<Icon className="shrink-0" name={icon} size={3.5} />}
        />
    );
});

SharedMenuItem.displayName = 'SharedMenuItemMemo';
