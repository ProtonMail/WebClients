import { type FC, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
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
import type { BaseFileDescriptor, FileAttachmentValues, FileID } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { eq, not, truthy } from '@proton/pass/utils/fp/predicates';
import { updateMap } from '@proton/pass/utils/fp/state';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos } from '@proton/shared/lib/helpers/browser';

import { FileAttachment } from './FileAttachment';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type Props = FieldProps<{}, FileAttachmentValues> &
    PropsWithChildren<{
        filesCount?: number /* Optional: When item is new, there are no previous files */;
        onDeleteAllFiles?: () => void;
    }>;

type FileUploadDescriptor = Omit<BaseFileDescriptor, 'fileID'> & { uploadID: string; fileID?: FileID };

export const FileAttachmentsField: FC<Props> = WithFeatureFlag(
    WithPaidUser(({ children, form, filesCount = 0, onDeleteAllFiles }) => {
        const { popup } = usePassCore();
        const dispatch = useAsyncRequestDispatch();

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
        const [loading, setLoading] = useState(false);
        const files = useMemo(() => Array.from(filesMap.values()), [filesMap]);
        const disableUploader = loading || !online;

        const uploadFiles = async (toUpload: File[]) => {
            const uploads = toUpload.map((file) => ({ file, uploadID: uniqueId() }));

            setFiles(
                updateMap((next) => {
                    uploads.forEach(({ file, uploadID }) => {
                        next.set(uploadID, {
                            name: file.name,
                            size: file.size,
                            mimeType: file.type,
                            uploadID,
                        });
                    });
                })
            );

            const fileIDs = await Promise.all(
                uploads.map(async ({ file, uploadID }) =>
                    fileUpload
                        .start(file, uploadID)
                        .then((fileID) => {
                            setFiles(updateMap((next) => next.set(uploadID, { ...next.get(uploadID)!, fileID })));
                            return fileID;
                        })
                        .catch((error) => {
                            setFiles(updateMap((next) => next.delete(uploadID)));
                            if (!isAbortError(error)) {
                                createNotification({
                                    type: 'error',
                                    text: c('Error').t`"${file.name}" could not be uploaded.`,
                                });
                            }

                            return undefined;
                        })
                )
            );

            void form.setFieldValue('files.toAdd', form.values.files.toAdd.concat(fileIDs.filter(truthy)));
        };

        const onAddFiles = async (newFiles: File[]) => {
            const validFiles = newFiles.filter((file) => file.size <= maxFileSize);

            // Let the user know that some files will not be uploaded
            if (validFiles.length < newFiles.length) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Some files were not uploaded because they exceed the maximum allowed file size.`,
                });
            }

            const totalNewFilesSize = validFiles.reduce((acc, file) => acc + file.size, 0);

            // Prevent users from exceeding the maximum storage limit
            if (usedStorage + totalNewFilesSize > maxStorage) {
                return createNotification({
                    type: 'error',
                    text: c('Error').t`Not enough available storage space for the selected files.`,
                });
            }

            try {
                setLoading(true);
                await uploadFiles(validFiles);
            } catch {
            } finally {
                setLoading(false);
            }
        };

        const handleRemove = async (uploadID: string, fileID?: string) => {
            setFiles(updateMap((next) => next.delete(uploadID)));
            if (fileID) return form.setFieldValue('files.toAdd', form.values.files.toAdd.filter(not(eq(fileID))));
        };

        const handleCancel = (uploadID: string) => {
            fileUpload.cancel(uploadID);
            setFiles(updateMap((next) => next.delete(uploadID)));
        };

        const handleRename = async (uploadID: string, fileName: string) => {
            const file = filesMap.get(uploadID);
            if (!file || file.name === fileName || !file.fileID) return;

            const res = await dispatch(fileUpdateMetadata, {
                ...file,
                fileID: file.fileID,
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

        useEffect(() => form.setStatus({ isBusy: loading }), [loading]);

        return (
            <Dropzone
                onDrop={(files) =>
                    canUseStorage
                        ? onAddFiles(files)
                        : upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })
                }
                disabled={disableUploader}
                border={false}
            >
                <div>
                    <FileAttachmentsSummary
                        filesCount={files.length + filesCount}
                        onDelete={handleDeleteAll}
                        deleteDisabled={disableUploader}
                    >
                        {children}

                        {files.map((file) => (
                            <FileAttachment
                                key={`file-${file.uploadID}`}
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
                                    title={c('Info')
                                        .t`Due to a limitation on Firefox, ${PASS_APP_NAME} needs to be re-opened in a new window before you can upload files.`}
                                >
                                    <div className="m-4">
                                        <Button
                                            className="rounded-full inline-block gap-1"
                                            disabled={disableUploader}
                                            shape="solid"
                                            color="weak"
                                            onClick={() => popup?.expand(pathname)}
                                            fullWidth
                                        >
                                            {c('Action').t`Open new window to upload files`}
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
                                    disabled={disableUploader}
                                    shape="solid"
                                    color="weak"
                                    multiple
                                >
                                    {c('Action').t`Choose a file or drag it here`}
                                </FileInput>
                            ))}

                        {!canUseStorage && (
                            <div className="m-4">
                                <Button
                                    className="rounded-full inline-block"
                                    disabled={disableUploader}
                                    shape="solid"
                                    color="weak"
                                    onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })}
                                    fullWidth
                                >
                                    {c('Action').t`Choose a file or drag it here`}
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
