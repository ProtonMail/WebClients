import { memo } from 'react';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { pipe } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    to: string;
    count: number;
    dense?: boolean;
    selected: boolean;
    label?: string;
    onAction?: () => void;
};

export const VaultMenuLink = memo(({ to, count, dense, selected, label, onAction = noop }: Props) => {
    const navigate = useNavigate();
    const onSelect = pipe(() => navigate(getLocalPath(to)), onAction);

    return (
        <DropdownMenuButton
            onClick={() => !selected && onSelect()}
            label={<span className="block text-ellipsis">{label}</span>}
            parentClassName={clsx('pass-vault-submenu-vault-item w-full')}
            className={clsx(selected && 'is-selected', !dense && 'py-3')}
            style={{ '--max-h-custom': '1.25rem' }}
            extra={<span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>}
            icon={<VaultIcon className="shrink-0" size={3.5} />}
        />
    );
});

VaultMenuLink.displayName = 'VaultMenuTrashMemo';
