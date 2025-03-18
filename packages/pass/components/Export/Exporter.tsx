import { type FC, useState } from 'react';

import { useFormik } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { ExportForm } from '@proton/pass/components/Export/ExportForm';
import { useExporter } from '@proton/pass/components/Export/ExportProvider';
import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { type ExportFormValues, ExportFormat } from '@proton/pass/lib/export/types';
import { validateExportForm } from '@proton/pass/lib/validation/export';
import type { MaybePromise } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    /** Optional assertion function that will be triggered
     * immediately before an export request */
    onConfirm: (password: string) => MaybePromise<void>;
};

export const Exporter: FC<Props> = ({ onConfirm }) => {
    const { createNotification } = useNotifications();
    const online = useConnectivity();
    const exporter = useExporter();

    const initialValues: ExportFormValues = { format: ExportFormat.EPEX, passphrase: '' };
    const [loading, setLoading] = useState(false);

    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();

    const form = useFormik<ExportFormValues>({
        initialValues: initialValues,
        initialErrors: validateExportForm(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateExportForm,
        onSubmit: async (values) => {
            if (online) {
                try {
                    setLoading(true);

                    await confirmPassword({
                        reauth: {
                            type: ReauthAction.SSO_EXPORT,
                            data: values,
                            fork: { promptBypass: 'none', promptType: 'default' },
                        },
                        message: passwordTypeSwitch({
                            extra: c('Info')
                                .t`Please confirm your extra password in order to export your ${PASS_APP_NAME} data`,
                            sso: c('Info')
                                .t`Please confirm your backup password in order to export your ${PASS_APP_NAME} data`,
                            default: c('Info')
                                .t`Please confirm your ${BRAND_NAME} password in order to export your ${PASS_APP_NAME} data`,
                        }),
                        onSubmit: (password) => onConfirm(password),
                        onError: () => throwError({ name: 'AuthConfirmInvalidError' }),
                        onAbort: () => throwError({ name: 'AuthConfirmAbortError' }),
                    });

                    download(await exporter.export(values));

                    form.resetForm({ values: { ...form.values, passphrase: '' } });
                    void form.validateForm();

                    createNotification({ type: 'success', text: c('Info').t`Successfully exported all your items` });
                } catch (error) {
                    const notification = (() => {
                        if (error instanceof Error) {
                            switch (error.name) {
                                case 'AuthConfirmInvalidError':
                                    return passwordTypeSwitch({
                                        sso: c('Error')
                                            .t`Authentication failed. Confirm your backup password in order to proceed with the export`,
                                        extra: c('Error')
                                            .t`Authentication failed. Confirm your extra password in order to proceed with the export`,
                                        default: c('Error')
                                            .t`Authentication failed. Confirm your ${BRAND_NAME} password in order to proceed with the export`,
                                    });
                                case 'AuthConfirmAbortError':
                                    return null;
                            }
                        }

                        return c('Warning').t`An error occurred while exporting your data`;
                    })();

                    logger.warn(`[Settings::Exporter] export failed`, error);
                    if (notification) createNotification({ type: 'error', text: notification });
                } finally {
                    setLoading(false);
                }
            }
        },
    });

    return <ExportForm form={form} loading={loading} />;
};
