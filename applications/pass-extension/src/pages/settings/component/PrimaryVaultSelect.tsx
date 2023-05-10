import { type VFC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { selectAllVaults, vaultSetPrimaryIntent } from '@proton/pass/store';

import { Field } from '../../../popup/components/Field/Field';
import { VaultSelectField } from '../../../popup/components/Field/VaultSelectField';

import './PrimaryVaultSelect.scss';

type FormValues = {
    primaryVaultId: string | undefined;
};

export const PrimaryVaultSelect: VFC = () => {
    const dispatch = useDispatch();
    const allVaults = useSelector(selectAllVaults);
    const primaryVaultId = allVaults.find((vault) => vault.primary)?.shareId;

    const form = useFormik<FormValues>({
        initialValues: { primaryVaultId },
        onSubmit: async (values) => {
            if (values.primaryVaultId) {
                dispatch(
                    vaultSetPrimaryIntent({
                        id: values.primaryVaultId,
                        name: allVaults.find(({ shareId }) => shareId === values.primaryVaultId)?.content
                            .name as string,
                    })
                );
            }
        },
        enableReinitialize: true,
    });

    const { initialValues, handleSubmit, values } = form;

    useEffect(() => {
        if (values !== initialValues) {
            handleSubmit();
        }
    }, [initialValues, values]);

    return (
        <Card rounded className="mb-4 p-3">
            <span className="text-bold">{c('Label').t`Vaults`}</span>
            <hr className="my-2 border-weak" />
            <FormikProvider value={form}>
                <Form>
                    <Field
                        name="primaryVaultId"
                        className="pass-primary-vault-select-field"
                        component={VaultSelectField}
                        label={c('Label').t`Primary vault`}
                    />
                </Form>
            </FormikProvider>
        </Card>
    );
};
