import type { FC } from 'react';

import { Field, Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Checkbox } from '@proton/components';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import type { ExportFormValues } from '@proton/pass/lib/export/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type ExporterProps = { form: FormikContextType<ExportFormValues>; loading: boolean };

export const ExportForm: FC<ExporterProps> = ({ form, loading = false }) => {
    return (
        <FormikProvider value={form}>
            <Form className="modal-two-dialog-container">
                <Checkbox
                    checked={form.values.encrypted}
                    onChange={(e) => form.setFieldValue('encrypted', e.target.checked)}
                    className="mb-4"
                >
                    <span>
                        {c('Label').t`Encrypt your ${PASS_APP_NAME} data export file`}
                        <span className="block color-weak text-sm">{c('Info')
                            .t`Export is encrypted using PGP and requires a strong passphrase.`}</span>
                    </span>
                </Checkbox>

                {form.values.encrypted ? (
                    <Field
                        name="passphrase"
                        label={c('Label').t`Passphrase`}
                        component={PasswordField}
                        autoComplete="off"
                    />
                ) : (
                    <em className="block text-sm color-weak mt-2">
                        {c('Info')
                            .t`This export will be unencrypted and anyone with access to your exported file will be able to see your passwords. For security, please delete it after you are done using it.`}
                    </em>
                )}

                <Button
                    type="submit"
                    color="norm"
                    loading={loading}
                    disabled={!form.isValid || loading}
                    className="mt-3 w-full"
                >
                    {c('Action').t`Export`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
