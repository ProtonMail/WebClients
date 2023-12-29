import { type FC, useState } from 'react';

import { useFormik } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { ConfirmPasswordModal } from '@proton/pass/components/Confirmation/ConfirmPasswordModal';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ExportForm } from '@proton/pass/components/Export/ExportForm';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { ExportFormValues } from '@proton/pass/lib/export/types';
import { validateExportForm } from '@proton/pass/lib/validation/export';
import type { MaybePromise } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

type Props = {
    /** Optional assertion function that will be triggered
     * immediately before an export request */
    onConfirm: (password: string) => MaybePromise<void>;
};

export const Exporter: FC<Props> = ({ onConfirm }) => {
    const { exportData } = usePassCore();
    const { createNotification } = useNotifications();

    const initialValues: ExportFormValues = { encrypted: false, passphrase: '' };
    const [loading, setLoading] = useState(false);

    const passwordConfirmModal = useAsyncModalHandles<string>();

    const form = useFormik<ExportFormValues>({
        initialValues: initialValues,
        initialErrors: validateExportForm(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateExportForm,
        onSubmit: async (values) => {
            try {
                setLoading(true);

                await passwordConfirmModal.handler({
                    onSubmit: (password) => onConfirm(password),
                    onError: () => throwError({ name: 'AuthConfirmInvalidError' }),
                    onAbort: () => throwError({ name: 'AuthConfirmAbortError' }),
                });

                const file = await exportData(values);
                downloadFile(file, file.name);

                form.resetForm({ values: { ...form.values, passphrase: '' } });
                createNotification({ type: 'success', text: c('Info').t`Successfully exported all your items` });
            } catch (error) {
                const notification = (() => {
                    if (error instanceof Error) {
                        switch (error.name) {
                            case 'AuthConfirmInvalidError':
                                return c('Error')
                                    .t`Authentication failed. Confirm your ${BRAND_NAME} password in order to proceed with the export`;
                            case 'AuthConfirmAbortError':
                                return null;
                        }
                    }

                    return c('Warning').t`An error occured while exporting your data`;
                })();

                logger.warn(`[Settings::Exporter] export failed`, error);
                if (notification) createNotification({ type: 'error', text: notification });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <>
            <ExportForm form={form} loading={loading} />
            <ConfirmPasswordModal
                message={c('Info')
                    .t`Please confirm your ${BRAND_NAME} password in order to export your ${PASS_APP_NAME} data`}
                onSubmit={passwordConfirmModal.resolver}
                onClose={passwordConfirmModal.abort}
                {...passwordConfirmModal.state}
            />
        </>
    );
};
