import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Icon, Option } from '@proton/components';
import type { VaultIconName } from '@proton/pass/components/Vault/VaultIcon';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectVaultLimits, selectWritableVaults } from '@proton/pass/store/selectors';
import type { Maybe, ShareType } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { prop } from '@proton/pass/utils/fp/lens';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP } from '../../Vault/constants';
import { SelectField, type SelectFieldProps } from './SelectField';

import './VaultPickerField.scss';

type VaultPickerSelection = { title: string; icon?: VaultIconName; color?: VaultColor };
type VaultPickerFieldProps = Omit<SelectFieldProps, 'children'> & {
    placeholder?: string;
    legacy?: boolean;
};

export const VaultPickerField: FC<VaultPickerFieldProps> = ({ placeholder, legacy, ...props }) => {
    const vaults = useSelector(selectWritableVaults);
    const writableShareIds = useSelector(selectWritableVaults).map(prop('shareId'));
    const { didDowngrade } = useSelector(selectVaultLimits);
    const selectedId = props.field.value;

    const selectedVault = useMemo<Maybe<VaultPickerSelection>>(() => {
        const vaultMatch = vaults.find(({ shareId }) => shareId === selectedId);

        if (vaultMatch) {
            return {
                title: vaultMatch?.content.name,
                icon: vaultMatch?.content.display.icon,
                color: vaultMatch?.content.display.color,
            };
        }
    }, [selectedId, vaults]);

    return (
        <div style={{ '--vault-item-color': VAULT_COLOR_MAP[selectedVault?.color ?? VaultColor.COLOR1] }}>
            <SelectField
                {...props}
                unstyled={!legacy}
                className={clsx('pass-vault-picker', legacy && 'pass-vault-picker--legacy', props.className)}
                selectClassName={clsx(!legacy && 'button button-pill button-medium button-solid-norm')}
                renderSelected={() => (
                    <div className="flex flex-nowrap gap-2 justify-items-center items-center">
                        <VaultIcon
                            icon={selectedVault?.icon}
                            color={selectedVault?.color ?? VaultColor.COLOR1}
                            size={3.5}
                            className="shrink-0"
                        />
                        <span className="text-sm text-ellipsis">
                            {selectedVault?.title ?? c('Placeholder').t`Pick a vault`}
                        </span>
                    </div>
                )}
            >
                {vaults.map(({ content, shared, shareId }: ShareItem<ShareType.Vault>) => {
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
                                    size={3.5}
                                    highlighted={selected}
                                />
                                <span className="flex-1 text-ellipsis">{content.name}</span>
                                {shared && (
                                    <Icon
                                        name="users"
                                        color={`var(${selected ? '--interaction-norm-contrast' : '--text-weak'})`}
                                        size={3.5}
                                    />
                                )}
                            </div>
                        </Option>
                    );
                })}
            </SelectField>
        </div>
    );
};
