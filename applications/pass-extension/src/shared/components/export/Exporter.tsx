import { useState } from 'react';

import { Field, Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Checkbox, useNotifications } from '@proton/components';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { isEmptyString } from '@proton/pass/utils/string';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { wait } from '@proton/shared/lib/helpers/promise';

import { PasswordField } from '../fields';
import { createExportFile } from './createExportFile';

type ExportFormValues = { passphrase: string; encrypted: boolean };

const initialValues: ExportFormValues = { passphrase: '', encrypted: true };
const validateFormValues = ({ encrypted, passphrase }: ExportFormValues): FormikErrors<ExportFormValues> =>
    encrypted && isEmptyString(passphrase) ? { passphrase: c('Warning').t`Passphrase is required` } : {};

export const Exporter: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { createNotification } = useNotifications();

    const form = useFormik<ExportFormValues>({
        initialValues: initialValues,
        initialErrors: validateFormValues(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateFormValues,
        onSubmit: async ({ encrypted, passphrase }) => {
            try {
                setLoading(true);

                await sendMessage.on(
                    pageMessage({
                        type: WorkerMessageType.EXPORT_REQUEST,
                        payload: encrypted ? { encrypted, passphrase } : { encrypted: false },
                    }),
                    async (res) => {
                        await wait(500);

                        if (res.type === 'success') {
                            const { filename, blob } = createExportFile(encrypted, res.data);
                            downloadFile(blob, filename);

                            createNotification({
                                type: 'success',
                                text: c('Info').t`Successfully exported all your items`,
                            });
                        } else {
                            throw new Error(res.error);
                        }
                    }
                );
            } catch (e) {
                logger.warn(`[Settings::Exporter] export failed`, e);
                createNotification({ type: 'error', text: c('Warning').t`An error occured while exporting your data` });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <FormikProvider value={form}>
            <Form className="modal-two-dialog-container">
                <Checkbox
                    checked={form.values.encrypted}
                    onChange={(e) => form.setFieldValue('encrypted', e.target.checked)}
                    className="mb-4"
                >
                    <span className="ml-3">
                        {c('Label').t`Encrypt your ${PASS_APP_NAME} data export file`}
                        <span className="block color-weak text-sm">{c('Info')
                            .t`Disable this option at your own risk : the output will be unprotected.`}</span>
                    </span>
                </Checkbox>

                <Field
                    name="passphrase"
                    label={c('Label').t`Passphrase`}
                    component={PasswordField}
                    disabled={!form.values.encrypted}
                />

                <Button
                    type="submit"
                    color="norm"
                    loading={loading}
                    disabled={!form.isValid || loading}
                    className="mt-3 w100"
                >
                    {c('Action').t`Export`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
