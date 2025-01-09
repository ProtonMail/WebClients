import { memo } from 'react';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { getVaultOptionInfo } from '@proton/pass/components/Menu/Vault/utils';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { pipe } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    count: number;
    dense?: boolean;
    selected: boolean;
    onAction?: () => void;
};

export const VaultMenuAll = memo(({ count, dense, selected, onAction = noop }: Props) => {
    const vaultActions = useVaultActions();

    return (
        <DropdownMenuButton
            onClick={pipe(() => !selected && vaultActions.select('all'), onAction)}
            label={<span className="block text-ellipsis">{getVaultOptionInfo('all').label}</span>}
            parentClassName={clsx('pass-vault-submenu-vault-item w-full')}
            className={clsx(selected && 'is-selected', !dense && 'py-3')}
            style={{ '--max-h-custom': '1.25rem' }}
            extra={<span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>}
            icon={<VaultIcon className="shrink-0" size={3.5} />}
        />
    );
});

VaultMenuAll.displayName = 'VaultMenuTrashMemo';
