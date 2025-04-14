import { type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { type FieldProps } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Dropzone, FileInput, Icon, Tooltip, useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { WithPaidUser } from '@proton/pass/components/Core/WithPaidUser';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useFileEncryptionVersion } from '@proton/pass/hooks/files/useFileEncryptionVersion';
import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { isAbortError } from '@proton/pass/lib/api/errors';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import {
    selectUserStorageAllowed,
    selectUserStorageMaxFileSize,
    selectUserStorageQuota,
    selectUserStorageUsed,
} from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileAttachmentValues, FileID, ShareId } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { eq, not } from '@proton/pass/utils/fp/predicates';
import { updateMap } from '@proton/pass/utils/fp/state';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos } from '@proton/shared/lib/helpers/browser';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { FileAttachment } from './FileAttachment';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type Props = FieldProps<{}, FileAttachmentValues> &
    PropsWithChildren<{
        shareId: ShareId;
        filesCount?: number /* Optional: When item is new, there are no previous files */;
        onDeleteAllFiles?: () => void;
    }>;

type FileUploadDescriptor = Omit<BaseFileDescriptor, 'fileID'> & { uploadID: string; fileID?: FileID };

export const FileAttachmentsField: FC<Props> = WithFeatureFlag(
    WithPaidUser(({ children, form, filesCount = 0, shareId, onDeleteAllFiles }) => {
        const { popup } = usePassCore();
        const dispatch = useAsyncRequestDispatch();
        const fileEncryptionVersion = useFileEncryptionVersion();

        const fileUpload = useFileUpload();
        const usedStorage = useSelector(selectUserStorageUsed);
        const maxStorage = useSelector(selectUserStorageQuota);
        const maxFileSize = useSelector(selectUserStorageMaxFileSize);
        const canUseStorage = useSelector(selectUserStorageAllowed);
        const { createNotification } = useNotifications();
        const online = useConnectivity();
        const upsell = useUpselling();
        const { pathname } = useLocation();

        const [filesMap, setFiles] = useState(new Map<string, FileUploadDescriptor>());
        const files = useMemo(() => Array.from(filesMap.values()), [filesMap]);

        const uploadFiles = useCallback(
            async (toUpload: File[]) => {
                const encryptionVersion = fileEncryptionVersion.current;
                const uploads = toUpload.map((file) => ({ file, uploadID: uniqueId() }));

                setFiles(
                    updateMap((next) => {
                        uploads.forEach(({ file, uploadID }) => {
                            next.set(uploadID, {
                                name: file.name,
                                size: file.size,
                                mimeType: file.type,
                                uploadID,
                                encryptionVersion,
                            });
                        });
                    })
                );

                await Promise.all(
                    uploads.map(async ({ file, uploadID }) =>
                        fileUpload
                            .start(file, file.name, shareId, uploadID)
                            .then((fileID) => {
                                setFiles(updateMap((next) => next.set(uploadID, { ...next.get(uploadID)!, fileID })));
                                return form.setValues((values) => {
                                    const toAdd = values.files.toAdd.concat([fileID]);
                                    return partialMerge(values, { files: { toAdd } });
                                });
                            })
                            .catch((error) => {
                                setFiles(updateMap((next) => next.delete(uploadID)));
                                if (!isAbortError(error)) {
                                    const detail = error instanceof Error ? `(${error.message})` : '';
                                    createNotification({
                                        type: 'error',
                                        text: `${c('Pass_file_attachments').t`"${file.name}" could not be uploaded.`} ${detail}`,
                                    });
                                }
                            })
                    )
                );
            },
            [shareId]
        );

        const onAddFiles = useCallback(
            async (newFiles: File[]) => {
                const validFiles = newFiles.filter((file) => file.size <= maxFileSize);
                const totalNewFilesSize = validFiles.reduce((acc, file) => acc + file.size, 0);
                const predictedStorage = usedStorage + totalNewFilesSize;

                /** Prevent users from exceeding the maximum storage limit */
                if (predictedStorage > maxStorage) {
                    return createNotification({
                        type: 'error',
                        text: c('Pass_file_attachments').t`Not enough available storage space for the selected files.`,
                    });
                }

                /** Let the user know that some files will not be uploaded */
                if (validFiles.length < newFiles.length) {
                    const maxFileSizeInMB = humanSize({ bytes: maxFileSize, unit: 'MB', fraction: 0 });
                    createNotification({
                        type: 'error',
                        text: c('Pass_file_attachments')
                            .t`Some files are too large to upload. The maximum allowed size is (${maxFileSizeInMB})`,
                    });
                }

                return uploadFiles(validFiles);
            },
            [maxFileSize]
        );

        const handleRemove = async (uploadID: string, fileID?: string) => {
            setFiles(updateMap((next) => next.delete(uploadID)));
            if (fileID) {
                await form.setValues((values) => {
                    const toAdd = values.files.toAdd.filter(not(eq(fileID)));
                    return partialMerge(values, { files: { toAdd } });
                });
            }
        };

        const handleCancel = (uploadID: string) => {
            fileUpload.cancel(uploadID);
            setFiles(updateMap((next) => next.delete(uploadID)));
        };

        const handleRename = async (uploadID: string, fileName: string) => {
            const file = filesMap.get(uploadID);
            if (!fileName.trim()) return;
            if (!file || file.name === fileName || !file.fileID) return;

            const res = await dispatch(fileUpdateMetadata, {
                ...file,
                fileID: file.fileID,
                shareId,
                name: fileName,
            });

            if (res.type === 'success') {
                setFiles(updateMap((next) => next.set(uploadID, { ...file, name: fileName })));
            }

            return res;
        };

        const handleDeleteAll = () => {
            void form.setFieldValue('files.toAdd', []);
            setFiles(new Map());
            onDeleteAllFiles?.();
        };

        useEffect(() => form.setStatus({ isBusy: fileUpload.loading }), [fileUpload.loading]);

        return (
            <Dropzone
                onDrop={(files) =>
                    canUseStorage
                        ? onAddFiles(files)
                        : upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })
                }
                disabled={!online}
                border={false}
                size="small"
            >
                <div className="min-h-custom">
                    <FileAttachmentsSummary
                        filesCount={files.length + filesCount}
                        onDelete={handleDeleteAll}
                        deleteDisabled={fileUpload.loading || !online}
                    >
                        {children}

                        {files.map((file) => (
                            <FileAttachment
                                key={file.uploadID}
                                file={file}
                                onCancel={() => handleCancel(file.uploadID)}
                                onDelete={() => handleRemove(file.uploadID, file.fileID)}
                                onRename={(fileName) => handleRename(file.uploadID, fileName)}
                                loading={!file.fileID}
                            />
                        ))}

                        {canUseStorage &&
                            /* On Firefox extension popup, clicking a file input will open the OS file picker
                             * but will also close the extension popup. So we require the user to
                             * re-open the popup in a new window to be able to upload files */
                            (BUILD_TARGET === 'firefox' && !popup?.expanded ? (
                                <Tooltip
                                    openDelay={2000}
                                    title={c('Pass_file_attachments')
                                        .t`Due to a limitation on Firefox, ${PASS_APP_NAME} needs to be re-opened in a new window before you can upload files.`}
                                >
                                    <div className="m-4">
                                        <Button
                                            className="rounded-full inline-block gap-1"
                                            shape="solid"
                                            color="weak"
                                            onClick={() => popup?.expand(pathname)}
                                            fullWidth
                                        >
                                            {c('Pass_file_attachments').t`Open new window to upload files`}
                                            <Icon name="arrow-within-square" className="shrink-0" />
                                        </Button>
                                    </div>
                                </Tooltip>
                            ) : (
                                <FileInput
                                    /** Disable the "accept" attribute on iOS because the
                                     * "accept" attribute does not support the extension */
                                    {...(isIos() ? {} : { accept: '*' })}
                                    className="m-4 rounded-full"
                                    onChange={({ target }) => onAddFiles([...(target.files ?? [])])}
                                    disabled={!online}
                                    shape="solid"
                                    color="weak"
                                    multiple
                                >
                                    {c('Pass_file_attachments').t`Choose a file or drag it here`}
                                </FileInput>
                            ))}

                        {!canUseStorage && (
                            <div className="m-4">
                                <Button
                                    className="rounded-full inline-block"
                                    shape="solid"
                                    color="weak"
                                    onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })}
                                    fullWidth
                                >
                                    {c('Pass_file_attachments').t`Choose a file or drag it here`}
                                </Button>
                            </div>
                        )}
                    </FileAttachmentsSummary>
                </div>
            </Dropzone>
        );
    }),
    PassFeature.PassFileAttachments
);
