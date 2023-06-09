import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option } from '@proton/components';
import { selectAllVaults, selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';
import type { Maybe } from '@proton/pass/types';
import type { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { notIn } from '@proton/pass/utils/fp';

import type { VaultIconName } from '../Vault/VaultIcon';
import { VaultIcon } from '../Vault/VaultIcon';
import { SelectField, type SelectFieldProps } from './SelectField';

type ExtraVaultSelectOption = { value: string; title: string; icon: VaultIconName; color?: VaultColor };
type SelectedVaultOption = { title: string; icon?: VaultIconName; color?: VaultColor };
type VaultSelectFieldProps = Omit<SelectFieldProps, 'children'> & {
    extraOptions?: ExtraVaultSelectOption[];
    excludeOptions?: string[];
    placeholder?: string;
};

export const VaultSelectField: VFC<VaultSelectFieldProps> = ({
    extraOptions = [],
    excludeOptions = [],
    placeholder,
    ...props
}) => {
    const vaults = useSelector(selectAllVaults);
    const primaryVaultId = useSelector(selectPrimaryVault).shareId;
    const { didDowngrade } = useSelector(selectVaultLimits);

    const selectedVault = useMemo<Maybe<SelectedVaultOption>>(() => {
        const vaultMatch = vaults.find(({ shareId }) => shareId === props.field.value);
        const extraMatch = extraOptions.find(({ value }) => value === props.field.value);

        if (vaultMatch || extraMatch) {
            return {
                title: vaultMatch?.content.name ?? extraMatch?.title!,
                icon: vaultMatch?.content.display.icon ?? extraMatch?.icon!,
                color: vaultMatch?.content.display.color ?? extraMatch?.color!,
            };
        }
    }, [props.field.value, vaults]);

    return (
        <SelectField
            {...props}
            icon={<VaultIcon icon={selectedVault?.icon} color={selectedVault?.color} size="large" />}
            renderSelected={() =>
                selectedVault?.title ?? (
                    <span className="color-weak">{placeholder ?? c('Placeholder').t`Pick a vault`}</span>
                )
            }
        >
            {vaults
                .filter(({ shareId }) => notIn(excludeOptions)(shareId))
                .map(({ shareId, content }) => (
                    <Option
                        key={shareId}
                        value={shareId}
                        title={content.name}
                        /* only allow selecting primary vault if
                         * a downgrade was detected */
                        disabled={didDowngrade && shareId !== primaryVaultId}
                    >
                        <div className="flex gap-x-3 flex-align-items-center">
                            <VaultIcon icon={content.display.icon} color={content.display.color} size="medium" />
                            <span className="flex-item-fluid text-ellipsis">{content.name}</span>
                        </div>
                    </Option>
                ))
                .concat(
                    ...extraOptions.map(({ value, title, icon, color }) => (
                        <Option key={value} value={value} title={title}>
                            <div className="flex gap-x-3 flex-align-items-center">
                                <VaultIcon icon={icon} size="medium" color={color} />
                                <span className="flex-item-fluid text-ellipsis">{title}</span>
                            </div>
                        </Option>
                    ))
                )}
        </SelectField>
    );
};
