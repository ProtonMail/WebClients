import type { FC } from 'react';
import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, Icon, Option, SelectTwo } from '@proton/components';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import { type ImportVault } from '@proton/pass/lib/import/types';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

type VaultsPickerOptionProps = {
    data: ImportVault;
    vaults: VaultShareItem[];
    allowNewVault: boolean;
    value: MaybeNull<string>;
    selected: boolean;
    onToggle: (checked: boolean) => void;
    onChange: (shareId: MaybeNull<string>) => void;
};

export const ImportVaultPickerOption: FC<VaultsPickerOptionProps> = ({
    data: { name, items },
    vaults,
    allowNewVault,
    value,
    selected,
    onToggle,
    onChange,
}) => {
    const count = useMemo(() => items.length, [items]);

    return (
        <div className="flex justify-space-between flex-align-items-center">
            <Checkbox checked={selected} onChange={(e) => onToggle(e.target.checked)}>
                <div className="w-custom" style={{ '--w-custom': '6.25rem' }}>
                    <strong className="text-sm block text-ellipsis">{name}</strong>
                    <span className="text-sm text-weak">
                        {c('Info').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </span>
                </div>
            </Checkbox>
            <Icon name="arrow-right" />
            <div className="w-custom" style={{ '--w-custom': '9.375rem' }}>
                <SelectTwo value={value} className="text-sm" onValue={(value) => onChange(value)} disabled={!selected}>
                    {[
                        /* if user needs to upgrade, this means he cannot
                         * create any more vaults - disable this option when
                         * trying to import if that is the case */
                        <Option
                            key={'new-vault'}
                            title={c('Label').t`Create new vault`}
                            value={null}
                            className="text-sm"
                            disabled={!allowNewVault}
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
                            >
                                <span className="flex flex-align-items-center">
                                    <Icon
                                        name={
                                            vault.content.display.icon
                                                ? VAULT_ICON_MAP[vault.content.display.icon]
                                                : 'pass-home'
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
    );
};
