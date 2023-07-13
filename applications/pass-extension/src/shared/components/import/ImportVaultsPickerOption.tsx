import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Checkbox, Icon, Option, SelectTwo } from '@proton/components';
import type { ImportVault } from '@proton/pass/import';
import { selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';
import type { VaultShare } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';

import { VAULT_ICON_MAP } from '../../../popup/components/Vault/constants';

type VaultsPickerOptionProps = {
    value: string;
    selected: boolean;
    onToggle: (checked: boolean) => void;
    onChange: (id: string) => void;
    data: ImportVault;
    vaults: VaultShare[];
    vaultsRemaining: number;
};

export const ImportVaultPickerOption: FC<VaultsPickerOptionProps> = ({
    value,
    selected,
    onToggle,
    onChange,
    data: { vaultName, items, id },
    vaults,
    vaultsRemaining,
}) => {
    const count = useMemo(() => items.length, [items]);
    const primaryVaultId = useSelector(selectPrimaryVault).shareId;
    const { didDowngrade, needsUpgrade } = useSelector(selectVaultLimits);

    /* handle edge case: when selecting "New Vault" then creating a new vault in extension popup, trigger onChange to
     * automatically switch "New Vault" to primary vault if vault limit is reached */
    useEffect(() => {
        if (vaultsRemaining < 0 && id === value) {
            onChange(primaryVaultId);
        }
    }, [vaultsRemaining]);

    return (
        <>
            <div className="flex flex-justify-space-between flex-align-items-center">
                <Checkbox checked={selected} onChange={(e) => onToggle(e.target.checked)}>
                    <div className="w-custom ml-2" style={{ '--w-custom': '100px' }}>
                        <strong className="text-sm block text-ellipsis">{vaultName}</strong>
                        <span className="text-sm text-weak">
                            {c('Info').ngettext(msgid`${count} item`, `${count} items`, count)}
                        </span>
                    </div>
                </Checkbox>
                <Icon name="arrow-right" />
                <div className="w-custom" style={{ '--w-custom': '150px' }}>
                    <SelectTwo
                        value={value}
                        className="text-sm"
                        onValue={(value) => onChange(value)}
                        disabled={!selected}
                    >
                        {[
                            /* if user needs to upgrade, this means he cannot
                             * create any more vaults - disable this option when
                             * trying to import if that is the case */
                            <Option
                                key={'new-vault'}
                                title={c('Label').t`Create new vault`}
                                value={id}
                                className="text-sm"
                                disabled={needsUpgrade || vaultsRemaining <= 0}
                            >
                                <span className="flex flex-align-items-center">
                                    <Icon name="plus" size={14} className="mr-3 flex-item-nogrow" />
                                    <span className="flex-item-fluid text-ellipsis">{c('Label').t`New vault`}</span>
                                </span>
                            </Option>,
                            ...vaults.map((vault) => (
                                <Option
                                    key={vault.shareId}
                                    title={vault.content.name}
                                    value={vault.shareId}
                                    className="text-sm"
                                    /* only allow selecting primary vault if a downgrade was detected */
                                    disabled={didDowngrade && vault.shareId !== primaryVaultId}
                                >
                                    <span className="flex flex-align-items-center">
                                        <Icon
                                            name={
                                                vault.content.display.icon
                                                    ? VAULT_ICON_MAP[vault.content.display.icon]
                                                    : 'vault'
                                            }
                                            size={14}
                                            className="mr-3 flex-item-nogrow"
                                        />
                                        <span className="flex-item-fluid text-ellipsis">{vault.content.name}</span>
                                    </span>
                                </Option>
                            )),
                        ].filter(truthy)}
                    </SelectTwo>
                </div>
            </div>
        </>
    );
};
