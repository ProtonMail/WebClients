import { type FC } from 'react';

import { c } from 'ttag';

import { Option } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';

import { WifiSecurities, wifiSecurityLabel } from './Custom.utils';

export const CustomTypeFields: FC<{ type: 'sshKey' | 'wifi' | 'custom' }> = ({ type }) => {
    switch (type) {
        case 'sshKey':
            return (
                <FieldsetCluster>
                    <Field
                        label={c('Label').t`Public key`}
                        name="publicKey"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                        icon="key"
                    />
                    <Field
                        label={c('Label').t`Private key`}
                        name="privateKey"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                        icon="key"
                    />
                </FieldsetCluster>
            );
        case 'wifi':
            return (
                <FieldsetCluster>
                    <Field
                        label={c('Label').t`Name (SSID)`}
                        name="ssid"
                        placeholder={c('Placeholder').t`Add text`}
                        component={TextField}
                        icon="text-align-left"
                    />
                    <Field
                        label={c('Label').t`Password`}
                        name="password"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                        icon="key"
                    />
                    <Field
                        label={c('Label').t`Security`}
                        name="security"
                        placeholder={c('Placeholder').t`Select option`}
                        component={SelectField}
                        icon="wrench"
                    >
                        {WifiSecurities.map((value) => {
                            const label = wifiSecurityLabel[value]();
                            return (
                                <Option value={value} title={label} key={value}>
                                    {label}
                                </Option>
                            );
                        })}
                    </Field>
                </FieldsetCluster>
            );
    }
};
