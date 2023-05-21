import { type VFC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option } from '@proton/components';
import { selectAllVaults, selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';

import { VaultIcon } from '../Vault/VaultIcon';
import { SelectField, type SelectFieldProps } from './SelectField';

type VaultSelectFieldProps = Omit<SelectFieldProps, 'children'>;

export const VaultSelectField: VFC<VaultSelectFieldProps> = (props) => {
    const vaults = useSelector(selectAllVaults);
    const primaryVaultId = useSelector(selectPrimaryVault).shareId;
    const { didDowngrade } = useSelector(selectVaultLimits);

    useEffect(() => {
        /* force select the primary vault shareId if user
         * has downgraded and is over his plan's limits */
        if (didDowngrade) props.form.setFieldValue(props.field.name, primaryVaultId);
    }, [didDowngrade]);

    const selectedVault = useMemo(
        () => vaults.find(({ shareId }) => shareId === props.field.value),
        [props.field.value, vaults]
    );

    const renderSelected = () =>
        selectedVault ? (
            selectedVault.content.name
        ) : (
            <span className="color-weak">{c('Placeholder').t`Pick a vault`}</span>
        );

    return vaults.length > 1 ? (
        <SelectField
            {...props}
            icon={
                <VaultIcon
                    icon={selectedVault?.content.display.icon}
                    color={selectedVault?.content.display.color}
                    size="large"
                />
            }
            renderSelected={renderSelected}
        >
            {vaults.map(({ shareId, content }) => (
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
            ))}
        </SelectField>
    ) : null;
};
