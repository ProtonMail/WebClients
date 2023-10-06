import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectAllVaults, selectPrimaryVault, vaultSetPrimaryIntent } from '@proton/pass/store';
import type { Maybe } from '@proton/pass/types';

/* TODO: move this to shared components */
import { Field } from '../../../popup/components/Field/Field';
import { VaultSelectField } from '../../../popup/components/Field/VaultSelectField';

import './AutosaveVault.scss';

type FormValues = { autosaveVaultId: Maybe<string> };

export const AutosaveVault: VFC = () => {
    const dispatch = useDispatch();
    const allVaults = useSelector(selectAllVaults);
    const autosaveVaultId = useSelector(selectPrimaryVault).shareId;

    const form = useFormik<FormValues>({
        initialValues: { autosaveVaultId },
        enableReinitialize: true,
        onSubmit: async (values) => {
            const match = allVaults.find(({ shareId }) => shareId === values.autosaveVaultId);

            if (match && match.shareId !== autosaveVaultId) {
                dispatch(vaultSetPrimaryIntent({ id: match.shareId, name: match.content.name }));
            }
        },
    });

    return (
        <div>
            <hr className="my-4 border-weak" />
            <FormikProvider value={form}>
                <Form>
                    <Field
                        name="autosaveVaultId"
                        className="pass-autosave-vault-select-field pass-input-group--no-focus"
                        component={VaultSelectField}
                        label={c('Label').t`Autosave vault`}
                        onValue={() => form.handleSubmit()}
                    />
                </Form>
            </FormikProvider>
        </div>
    );
};
