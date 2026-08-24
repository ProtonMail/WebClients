import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { selectAllVaults } from '../../../store/selectors';
import { PassFeature } from '../../../types/api/features';
import { pipe } from '../../../utils/fp/pipe';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { useVaultActions } from '../../Vault/VaultActionsProvider';
import { VaultIcon } from '../../Vault/VaultIcon';
import { getVaultOptionInfo } from './utils';

type Props = {
    count: number;
    selected: boolean;
    onAction?: () => void;
};

export const VaultMenuAll = memo(({ count, selected, onAction = noop }: Props) => {
    const { select, organize } = useVaultActions();
    const vaults = useSelector(selectAllVaults);
    const hideShowVaultFeatureFlag = useFeatureFlag(PassFeature.PassHideShowVault);
    const vaultOrganizationEnabled = vaults.length > 0 && hideShowVaultFeatureFlag;

    return (
        <DropdownMenuButton
            onClick={pipe(() => !selected && select('all'), onAction)}
            label={
                <div>
                    <div className="text-ellipsis">{getVaultOptionInfo('all').label}</div>
                    <div className="color-weak">
                        {c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </div>
                </div>
            }
            parentClassName={clsx('pass-vault-submenu-vault-item w-full')}
            className={clsx(selected && 'is-selected', 'pl-2 pr-2')}
            icon={<VaultIcon className="shrink-0 mr-1" size={4} background />}
            quickActions={
                vaultOrganizationEnabled
                    ? [
                          <DropdownMenuButton
                              key="vault-edit"
                              label={c('Action').t`Organize vaults`}
                              icon="list-bullets"
                              onClick={organize}
                          />,
                      ]
                    : undefined
            }
        />
    );
});

VaultMenuAll.displayName = 'VaultMenuTrashMemo';
