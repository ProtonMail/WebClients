import { memo } from 'react';

import { c, msgid } from 'ttag';

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
            label={
                <div>
                    <div className="text-ellipsis">{getVaultOptionInfo('all').label}</div>
                    <div className="color-weak">
                        {c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </div>
                </div>
            }
            parentClassName={clsx('pass-vault-submenu-vault-item w-full')}
            className={clsx(selected && 'is-selected', !dense && 'py-2')}
            icon={<VaultIcon className="shrink-0" size={4} background />}
        />
    );
});

VaultMenuAll.displayName = 'VaultMenuTrashMemo';
