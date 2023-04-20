import { FC, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, Icon, Option, SelectTwo } from '@proton/components';
import { ImportVault } from '@proton/pass/import';
import { VaultShare } from '@proton/pass/types';

import { VAULT_ICON_MAP } from '../../../popup/components/Vault/constants';

type VaultsPickerOptionProps = {
    value: string;
    selected: boolean;
    onToggle: (checked: boolean) => void;
    onChange: (id: string) => void;
    data: ImportVault;
    vaults: VaultShare[];
};

export const ImportVaultPickerOption: FC<VaultsPickerOptionProps> = ({
    value,
    selected,
    onToggle,
    onChange,
    data: { vaultName, items, id },
    vaults,
}) => {
    const count = useMemo(() => items.length, [items]);

    return (
        <>
            <div className="flex flex-justify-space-between flex-align-items-center">
                <Checkbox checked={selected} onChange={(e) => onToggle(e.target.checked)}>
                    <div className="w-custom ml0-5" style={{ '--width-custom': '100px' }}>
                        <strong className="text-sm block text-ellipsis">{vaultName}</strong>
                        <span className="text-sm text-weak">
                            {c('Info').ngettext(msgid`${count} item`, `${count} items`, count)}
                        </span>
                    </div>
                </Checkbox>
                <Icon name="arrow-right" />
                <div className="w-custom" style={{ '--width-custom': '150px' }}>
                    <SelectTwo
                        value={value}
                        className="text-sm"
                        onValue={(value) => onChange(value)}
                        disabled={!selected}
                    >
                        {[
                            <Option
                                key={'new-vault'}
                                title={c('Label').t`Create new vault`}
                                value={id}
                                className="text-sm"
                            >
                                <span className="flex flex-align-items-center">
                                    <Icon name="plus" size={14} className="mr0-75 flex-item-nogrow" />
                                    <span className="flex-item-fluid text-ellipsis">{c('Label').t`New vault`}</span>
                                </span>
                            </Option>,
                            ...vaults.map((vault) => (
                                <Option
                                    key={vault.shareId}
                                    title={vault.content.name}
                                    value={vault.shareId}
                                    className="text-sm"
                                >
                                    <span className="flex flex-align-items-center">
                                        <Icon
                                            name={
                                                vault.content.display.icon
                                                    ? VAULT_ICON_MAP[vault.content.display.icon]
                                                    : 'vault'
                                            }
                                            size={14}
                                            className="mr0-75 flex-item-nogrow"
                                        />
                                        <span className="flex-item-fluid text-ellipsis">{vault.content.name}</span>
                                    </span>
                                </Option>
                            )),
                        ]}
                    </SelectTwo>
                </div>
            </div>
        </>
    );
};
