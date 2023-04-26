import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option } from '@proton/components';
import { selectAllVaults } from '@proton/pass/store';

import { FieldsetCluster } from '../Fields';
import { SelectField, type SelectFieldProps } from '../Fields';
import { VaultIcon } from './VaultIcon';

type VaultSelectFieldProps = Omit<SelectFieldProps, 'children'>;

export const VaultSelectField: VFC<VaultSelectFieldProps> = (props) => {
    const vaults = useSelector(selectAllVaults);

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
        <FieldsetCluster className="mb-4">
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
                    <Option key={shareId} value={shareId} title={content.name}>
                        <div className="flex gap-x-3 flex-align-items-center">
                            <VaultIcon icon={content.display.icon} color={content.display.color} size="medium" />
                            <span className="flex-item-fluid text-ellipsis">{content.name}</span>
                        </div>
                    </Option>
                ))}
            </SelectField>
        </FieldsetCluster>
    ) : null;
};
