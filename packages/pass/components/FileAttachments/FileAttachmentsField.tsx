import { type FC, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type FieldProps } from 'formik';
import { c } from 'ttag';

import { Dropzone, FileInput, useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { WithPaidUser } from '@proton/pass/components/Core/WithPaidUser';
import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import {
    selectUserStorageMaxFileSize,
    selectUserStorageQuota,
    selectUserStorageUsed,
} from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileAttachmentValues, FileID } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { eq, not, truthy } from '@proton/pass/utils/fp/predicates';
import { updateMap } from '@proton/pass/utils/fp/state';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
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
        const dispatch = useDispatch();
        const fileUpload = useFileUpload();
        const usedStorage = useSelector(selectUserStorageUsed);
        const maxStorage = useSelector(selectUserStorageQuota);
        const maxFileSize = useSelector(selectUserStorageMaxFileSize);
        const { createNotification } = useNotifications();
        const online = useConnectivity();

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
                        .catch(() => {
                            setFiles(updateMap((next) => next.delete(uploadID)));

                            createNotification({
                                type: 'error',
                                text: c('Error').t`"${file.name}" could not be uploaded.`,
                            });

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

        const onRemoveFile = async (uploadID: string, fileID?: string) => {
            setFiles(updateMap((next) => next.delete(uploadID)));
            if (fileID) return form.setFieldValue('files.toAdd', form.values.files.toAdd.filter(not(eq(fileID))));
        };

        const onRename = (uploadID: string, fileName: string) => {
            const file = filesMap.get(uploadID);
            if (!file || file.name === fileName) return;

            setFiles(updateMap((next) => next.set(uploadID, { ...file, name: fileName })));
            if (file.fileID) dispatch(fileUpdateMetadata.intent({ ...file, fileID: file.fileID, name: fileName }));
        };

        const handleDeleteAll = () => {
            void form.setFieldValue('files.toAdd', []);
            setFiles(new Map());
            onDeleteAllFiles?.();
        };

        useEffect(() => form.setStatus({ isBusy: loading }), [loading]);

        return (
            <Dropzone onDrop={onAddFiles} disabled={disableUploader} border={false}>
                <div>
                    <FileAttachmentsSummary
                        filesCount={files.length + filesCount}
                        onDelete={handleDeleteAll}
                        disabled={disableUploader}
                    >
                        {children}

                        {files.map((file) => (
                            <FileAttachment
                                key={`file-${file.uploadID}`}
                                file={file}
                                onCancel={() => fileUpload.cancel(file.uploadID)}
                                onDelete={() => onRemoveFile(file.uploadID, file.fileID)}
                                onRename={(fileName) => onRename(file.uploadID, fileName)}
                                loading={!file.fileID}
                            />
                        ))}

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
                    </FileAttachmentsSummary>
                </div>
            </Dropzone>
        );
    }),
    PassFeature.PassFileAttachments
);
