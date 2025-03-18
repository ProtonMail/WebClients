import { type FC, type PropsWithChildren, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type FieldProps } from 'formik';
import { c } from 'ttag';

import { Dropzone, FileInput, useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { WithPaidUser } from '@proton/pass/components/Core/WithPaidUser';
import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import { selectUserStorageQuota, selectUserStorageUsed } from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileAttachmentValues, FileID } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isIos } from '@proton/shared/lib/helpers/browser';

import { FileAttachment } from './FileAttachment';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type Props = FieldProps<{}, FileAttachmentValues> &
    PropsWithChildren<{
        maxFiles?: number;
        filesCount?: number /* Optional: When item is new, there are no previous files */;
        onDeleteAllFiles?: () => void;
    }>;

export const FileAttachmentsField: FC<Props> = WithFeatureFlag(
    WithPaidUser(({ children, form, maxFiles = 10, filesCount = 0, onDeleteAllFiles }) => {
        const dispatch = useDispatch();
        const { uploadFile, cancelUpload } = useFileUpload();
        const [loading, setLoading] = useState(false);
        const [files, setFiles] = useState<Omit<BaseFileDescriptor, 'fileID'>[]>([]);
        const usedStorage = useSelector(selectUserStorageUsed);
        const maxStorage = useSelector(selectUserStorageQuota);
        const { createNotification } = useNotifications();
        const online = useConnectivity();

        const disableUploader = form.values.files.toAdd.length >= maxFiles || loading || !online;

        const uploadFiles = async (newFiles: File[]) => {
            const filesIds: FileID[] = [];

            for (const file of newFiles) {
                const fileID = await uploadFile(file);
                if (fileID) filesIds.push(fileID);
            }

            void form.setFieldValue('files.toAdd', form.values.files.toAdd.concat(filesIds));
        };

        const onAddFiles = async (newFiles: File[]) => {
            const totalNewFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);

            // Prevent users from exceeding the maximum storage limit
            if (usedStorage + totalNewFilesSize > maxStorage) {
                return createNotification({
                    type: 'error',
                    text: c('Error').t`Not enough available storage space for the selected files.`,
                });
            }

            const filteredFiles: File[] = (() => {
                if (form.values.files.toAdd.length + newFiles.length <= maxFiles) return newFiles;
                createNotification({
                    type: 'error',
                    text: c('Error').t`The maximum allowed quantity of files to add per action is ${maxFiles}`,
                });
                return newFiles.slice(0, maxFiles - form.values.files.toAdd.length);
            })();

            if (!filteredFiles.length) return;

            setFiles((f) => f.concat(filteredFiles.map(({ name, type, size }) => ({ name, size, mimeType: type }))));

            try {
                setLoading(true);
                await uploadFiles(filteredFiles);
            } catch {
                setFiles((f) => f.slice(0, f.length - filteredFiles.length));
            } finally {
                setLoading(false);
            }
        };

        const onRemoveFile = async (fileIndex: number) => {
            setFiles((f) => f.filter((_, i) => i !== fileIndex));

            void form.setFieldValue(
                'files.toAdd',
                form.values.files.toAdd.filter((_, i) => i !== fileIndex)
            );
        };

        const onRename = (idx: number, fileName: string) => {
            const fileDescriptor = files[idx];

            if (fileDescriptor.name === fileName) return;

            setFiles((f) => f.map((file, index) => ({ ...file, name: idx === index ? fileName : file.name })));

            dispatch(
                fileUpdateMetadata.intent({ ...fileDescriptor, fileID: form.values.files.toAdd[idx], name: fileName })
            );
        };

        const handleDeleteAll = () => {
            void form.setFieldValue('files.toAdd', []);
            onDeleteAllFiles?.();
            setFiles([]);
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

                        {files.map((file, idx) => (
                            <FileAttachment
                                key={`file-${idx}`}
                                file={file}
                                onCancel={cancelUpload}
                                onDelete={() => onRemoveFile(idx)}
                                onRename={(fileName) => onRename(idx, fileName)}
                                /* Display loader on files added to the UI but not uploaded yet */
                                loading={idx >= form.values.files.toAdd.length}
                            />
                        ))}

                        <FileInput
                            // disable the "accept" attribute on iOS because the "accept" attribute does not support the file extension
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
