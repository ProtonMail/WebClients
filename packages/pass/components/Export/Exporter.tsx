import { type FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFormik } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { useCurrentPort, useCurrentTabID } from '@proton/pass/components/Core/PassCoreProvider';
import { ExportForm } from '@proton/pass/components/Export/ExportForm';
import { ProgressModal } from '@proton/pass/components/FileAttachments/ProgressModal';
import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { isAbortError } from '@proton/pass/lib/api/errors';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { ExportFormat, type ExportRequestOptions } from '@proton/pass/lib/export/types';
import { mimetypeForDownload } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { getSafeStorage } from '@proton/pass/lib/file-storage/utils';
import { validateExportForm } from '@proton/pass/lib/validation/export';
import { exportData } from '@proton/pass/store/actions/creators/export';
import { requestCancel } from '@proton/pass/store/request/actions';
import { selectRequest } from '@proton/pass/store/selectors';
import type { MaybePromise } from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';
import { throwError } from '@proton/pass/utils/fp/throw';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    /** Optional assertion function that will be triggered
     * immediately before an export request */
    onConfirm: (password: string) => MaybePromise<void>;
};

export const Exporter: FC<Props> = ({ onConfirm }) => {
    const tabId = useCurrentTabID();
    const port = useCurrentPort();

    const requestID = exportData.requestID({ tabId });

    const { createNotification } = useNotifications();
    const online = useConnectivity();
    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();

    const initialValues: ExportRequestOptions = {
        format: ExportFormat.PGP,
        passphrase: '',
        fileAttachments: false,
        storageType: fileStorage.type,
    };

    const [loading, setLoading] = useState(false);

    const request = useSelector(selectRequest(requestID));
    const progress = request?.status === 'start' ? request.progress : null;

    const cancelExport = () => {
        dispatch(requestCancel(requestID));
    };

    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();

    const form = useFormik<ExportRequestOptions>({
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

                    const result = await asyncDispatch(exportData, { ...values, tabId, port });

                    if (result.type !== 'success') {
                        if (result.data.aborted) throw new DOMException('User cancelled export', 'AbortError');
                        throw new Error(result.data.error);
                    }

                    let { mimeType, fileRef, storageType } = result.data;
                    mimeType = mimetypeForDownload(mimeType);

                    const fs = getSafeStorage(storageType);
                    const file = await fs.readFile(fileRef, mimeType);
                    if (!file) throw new Error('File not found');

                    download(file, fileRef);

                    createNotification({
                        type: 'success',
                        text: c('Info').t`Successfully exported all your items`,
                    });
                } catch (error) {
                    const notification = (() => {
                        if (isAbortError(error)) return null;

                        let details = '';

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
                                default:
                                    details = error.message ? `(${error.message})` : '';
                            }
                        }

                        return `${c('Warning').t`An error occurred while exporting your data`} ${details}`;
                    })();

                    if (notification) createNotification({ type: 'error', text: notification });
                } finally {
                    setLoading(false);
                    form.resetForm({ values: form.values });
                    void form.validateForm();
                }
            }
        },
    });

    useEffect(() => cancelExport, []);

    return (
        <>
            <ExportForm form={form} loading={loading} />

            {form.values.fileAttachments && progress !== null && (
                <ProgressModal
                    title={c('Pass_file_attachments').t`Exporting files`}
                    progress={progress ?? 0}
                    message={c('Pass_file_attachments').t`Please be patient while your files are being downloaded.`}
                    onCancel={cancelExport}
                />
            )}
        </>
    );
};
