import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { selectAllVaults, selectPrimaryVault, vaultSetPrimaryIntent } from '@proton/pass/store';
import type { Maybe } from '@proton/pass/types';

import { Field } from '../../../popup/components/Field/Field';
import { VaultSelectField } from '../../../popup/components/Field/VaultSelectField';

import './VaultsPanel.scss';

type FormValues = { primaryVaultId: Maybe<string> };

export const VaultsPanel: VFC = () => {
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
        <Card rounded className="mb-4 p-3">
            <span className="text-bold block">{c('Label').t`Vaults`}</span>

            <hr className="my-2 border-weak" />
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
        </Card>
    );
};
