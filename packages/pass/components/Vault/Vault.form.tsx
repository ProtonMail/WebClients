import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { RadioButton, RadioButtonGroupField } from '@proton/pass/components/Form/Field/RadioButtonGroupField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { VAULT_COLORS, VAULT_ICONS } from '@proton/pass/components/Vault/constants';
import {
    type VaultColor as VaultColorEnum,
    type VaultIcon as VaultIconEnum,
} from '@proton/pass/types/protobuf/vault-v1';

export type VaultFormValues = { name: string; description: string; color: VaultColorEnum; icon: VaultIconEnum };
type Props<V extends VaultFormValues> = { form: FormikContextType<V>; autoFocus?: boolean; disabled?: boolean };

export const VaultForm = <V extends VaultFormValues>({ form, disabled, autoFocus }: Props<V>) => (
    <div style={{ '--min-grid-template-column-size': '2.25rem' }}>
        <div className="flex flex-align-items-center gap-x-3">
            <VaultIcon color={form.values.color} icon={form.values.icon} size={20} background />
            <div className="flex-item-fluid">
                <FieldsetCluster>
                    <Field
                        name="name"
                        component={TitleField}
                        label={c('Label').t`Title`}
                        placeholder={c('Placeholder').t`Untitled`}
                        autoFocus={autoFocus}
                        disabled={disabled}
                        key={`vault-title-${autoFocus}`}
                    />
                </FieldsetCluster>
            </div>
        </div>

        <Field
            name="color"
            component={RadioButtonGroupField}
            className="grid-auto-fill gap-x-6 gap-y-4 my-6"
            disabled={disabled}
        >
            {VAULT_COLORS.slice(2).map(([vaultColor, rgb]) => (
                <RadioButton<VaultColorEnum> key={`vault-color-${vaultColor}`} value={vaultColor} color={rgb} />
            ))}
        </Field>

        <Field
            name="icon"
            component={RadioButtonGroupField}
            className="grid-auto-fill gap-x-6 gap-y-4"
            disabled={disabled}
        >
            {VAULT_ICONS.slice(2).map(([vaultIcon, icon]) => (
                <RadioButton<VaultIconEnum> key={`vault-icon-${vaultIcon}`} value={vaultIcon} icon={icon} />
            ))}
        </Field>
    </div>
);
