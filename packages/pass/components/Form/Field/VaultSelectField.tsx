import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Icon, Option } from '@proton/components';
import type { VaultIconName } from '@proton/pass/components/Vault/VaultIcon';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { selectVaultLimits, selectWritableVaults } from '@proton/pass/store/selectors';
import { type Maybe } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn } from '@proton/pass/utils/fp/predicates';

import { SelectField, type SelectFieldProps } from './SelectField';

type ExtraVaultSelectOption = { value: string; title: string; icon: VaultIconName; color?: VaultColor };
type SelectedVaultOption = { title: string; icon?: VaultIconName; color?: VaultColor };
type VaultSelectFieldProps = Omit<SelectFieldProps, 'children'> & {
    extraOptions?: ExtraVaultSelectOption[];
    excludeOptions?: string[];
    placeholder?: string;
};

export const VaultSelectField: FC<VaultSelectFieldProps> = ({
    extraOptions = [],
    excludeOptions = [],
    placeholder,
    ...props
}) => {
    const vaults = useSelector(selectWritableVaults);
    const writableShareIds = useSelector(selectWritableVaults).map(prop('shareId'));
    const { didDowngrade } = useSelector(selectVaultLimits);
    const selectedId = props.field.value;

    const selectedVault = useMemo<Maybe<SelectedVaultOption>>(() => {
        const vaultMatch = vaults.find(({ shareId }) => shareId === selectedId);
        const extraMatch = extraOptions.find(({ value }) => value === selectedId);

        if (vaultMatch || extraMatch) {
            return {
                title: vaultMatch?.content.name ?? extraMatch?.title!,
                icon: vaultMatch?.content.display.icon ?? extraMatch?.icon!,
                color: vaultMatch?.content.display.color ?? extraMatch?.color!,
            };
        }
    }, [selectedId, vaults]);

    return (
        <SelectField
            {...props}
            icon={<VaultIcon icon={selectedVault?.icon} color={selectedVault?.color} size={5} background />}
            renderSelected={() =>
                selectedVault?.title ?? (
                    <span className="color-weak">{placeholder ?? c('Placeholder').t`Pick a vault`}</span>
                )
            }
        >
            {vaults
                .filter(({ shareId }) => notIn(excludeOptions)(shareId))
                .map(({ shareId, content, shared }) => {
                    const selected = selectedId === shareId;
                    return (
                        <Option
                            key={shareId}
                            value={shareId}
                            title={content.name}
                            /* only allow selecting writable vaults if a downgrade was detected */
                            disabled={didDowngrade && !writableShareIds.includes(shareId)}
                        >
                            <div className="flex gap-x-3 items-center">
                                <VaultIcon
                                    icon={content.display.icon}
                                    color={content.display.color}
                                    size={4}
                                    highlighted={selected}
                                />
                                <span className="flex-1 text-ellipsis">{content.name}</span>
                                {shared && (
                                    <Icon
                                        name="users"
                                        color={`var(${selected ? '--interaction-norm-contrast' : '--text-weak'})`}
                                        size={4}
                                    />
                                )}
                            </div>
                        </Option>
                    );
                })
                .concat(
                    ...extraOptions.map(({ value, title, icon, color }) => (
                        <Option key={value} value={value} title={title}>
                            <div className="flex gap-x-3 items-center">
                                <VaultIcon
                                    icon={icon}
                                    size={4}
                                    color={selectedId ? VaultColor.COLOR_CUSTOM : color}
                                    highlighted={selectedId === value}
                                />
                                <span className="flex-1 text-ellipsis">{title}</span>
                            </div>
                        </Option>
                    ))
                )}
        </SelectField>
    );
};
