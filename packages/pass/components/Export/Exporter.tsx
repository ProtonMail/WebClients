import { type FC, useState } from 'react';

import { useFormik } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ExportForm } from '@proton/pass/components/Export/ExportForm';
import type { ExportFormValues } from '@proton/pass/lib/export/types';
import { validateExportForm } from '@proton/pass/lib/validation/export';
import type { MaybePromise } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

type Props = {
    /** Optional assertion function that will be triggered
     * immediately before an export request */
    assert?: () => MaybePromise<void>;
};

export const Exporter: FC<Props> = ({ assert }) => {
    const { exportData } = usePassCore();
    const { createNotification } = useNotifications();

    const initialValues: ExportFormValues = { encrypted: false, passphrase: '' };
    const [loading, setLoading] = useState(false);

    const form = useFormik<ExportFormValues>({
        initialValues: initialValues,
        initialErrors: validateExportForm(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateExportForm,
        onSubmit: async (values) => {
            try {
                setLoading(true);
                await assert?.();
                const file = await exportData(values);

                createNotification({ type: 'success', text: c('Info').t`Successfully exported all your items` });
                downloadFile(file, file.name);
            } catch (e) {
                logger.warn(`[Settings::Exporter] export failed`, e);
                createNotification({ type: 'error', text: c('Warning').t`An error occured while exporting your data` });
            } finally {
                setLoading(false);
            }
        },
    });

    return <ExportForm form={form} loading={loading} />;
};
