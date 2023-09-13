import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectAllVaults, selectPrimaryVault, vaultSetPrimaryIntent } from '@proton/pass/store';
import type { Maybe } from '@proton/pass/types';

/* TODO: move this to shared components */
import { Field } from '../../../popup/components/Field/Field';
import { VaultSelectField } from '../../../popup/components/Field/VaultSelectField';
import { SettingsPanel } from './SettingsPanel';

import './PrimaryVault.scss';

type FormValues = { primaryVaultId: Maybe<string> };

export const PrimaryVault: VFC = () => {
    const dispatch = useDispatch();
    const allVaults = useSelector(selectAllVaults);
    const primaryVaultId = useSelector(selectPrimaryVault).shareId;

    const form = useFormik<FormValues>({
        initialValues: { primaryVaultId },
        enableReinitialize: true,
        onSubmit: async (values) => {
            const match = allVaults.find(({ shareId }) => shareId === values.primaryVaultId);

            if (match && match.shareId !== primaryVaultId) {
                dispatch(vaultSetPrimaryIntent({ id: match.shareId, name: match.content.name }));
            }
        },
    });

    return (
        <SettingsPanel title={c('Label').t`Vaults`}>
            <FormikProvider value={form}>
                <Form>
                    <Field
                        name="primaryVaultId"
                        className="pass-primary-vault-select-field pass-input-group--no-focus"
                        component={VaultSelectField}
                        label={c('Label').t`Primary vault`}
                        onValue={() => form.handleSubmit()}
                    />
                </Form>
            </FormikProvider>
        </SettingsPanel>
    );
};
