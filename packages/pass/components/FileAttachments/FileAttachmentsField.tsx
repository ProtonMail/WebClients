import { type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import type { FieldProps } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Dropzone from '@proton/components/components/dropzone/Dropzone';
import FileInput from '@proton/components/components/input/FileInput';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { FILE_ENCRYPTION_VERSION, UpsellRef } from '@proton/pass/constants';
import { resolveMimeTypeForFile, useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { isAbortError } from '@proton/pass/lib/api/errors';
import { validateFileName } from '@proton/pass/lib/file-attachments/helpers';
import { fileUpdateMetadata } from '@proton/pass/store/actions';
import {
    selectUser,
    selectUserPlan,
    selectUserStorageAllowed,
    selectUserStorageMaxFileSize,
    selectUserStorageQuota,
    selectUserStorageUsed,
} from '@proton/pass/store/selectors';
import type { BaseFileDescriptor, FileAttachmentValues, FileID, ShareId } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { eq, not } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { updateMap } from '@proton/pass/utils/fp/state';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { PLANS } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos } from '@proton/shared/lib/helpers/browser';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { FileAttachment } from './FileAttachment';
import { FileAttachmentsSummary } from './FileAttachmentsSummary';

type Props = FieldProps<{}, FileAttachmentValues> &
    PropsWithChildren<{
        shareId: ShareId;
        filesCount?: number /* Optional: When item is new, there are no previous files */;
        onDeleteAllFiles?: () => void;
    }>;

type FileUploadDescriptor = Omit<BaseFileDescriptor, 'fileID'> & { uploadID: string; fileID?: FileID };

export const FileAttachmentsField: FC<Props> = ({ children, form, filesCount = 0, shareId, onDeleteAllFiles }) => {
    const { popup } = usePassCore();
    const dispatch = useAsyncRequestDispatch();

    const fileUpload = useFileUpload();
    const usedStorage = useSelector(selectUserStorageUsed);
    const maxStorage = useSelector(selectUserStorageQuota);
    const maxFileSize = useSelector(selectUserStorageMaxFileSize);
    const canUseStorage = useSelector(selectUserStorageAllowed);
    const { createNotification } = useNotifications();
    const online = useOnline();
    const upsell = useUpselling();
    const { pathname } = useLocation();

    // Upselling Pass Ess works differently to upselling B2C. It also works differently for admin and members.
    const essentialsUpsellEnabled = useFeatureFlag(PassFeature.PassFileAttachmentsEssentialsUpsell);
    const isPassEssentials = useMatchUser({ planInternalName: [PLANS.PASS_PRO] });
    const user = useSelector(selectUser);
    const userIsAdmin = user ? isAdmin(user) : false;
    const userPlan = useSelector(selectUserPlan);
    const navigateToUpgrade = useNavigateToUpgrade({
        upsellRef: UpsellRef.FILE_ATTACHMENTS,
        targetPage: 'compare',
        plan: userPlan?.InternalName,
    });

    const [filesMap, setFiles] = useState(new Map<string, FileUploadDescriptor>());
    const files = useMemo(() => Array.from(filesMap.values()), [filesMap]);

    const uploadFiles = useCallback(
        async (toUpload: File[]) => {
            const uploads = await seq(toUpload, async (file) => ({
                file,
                mimeType: await resolveMimeTypeForFile(file),
                uploadID: uniqueId(),
            }));

            setFiles(
                updateMap((next) => {
                    uploads.forEach(({ file, uploadID, mimeType }) => {
                        next.set(uploadID, {
                            name: file.name,
                            size: file.size,
                            mimeType,
                            uploadID,
                            encryptionVersion: FILE_ENCRYPTION_VERSION,
                        });
                    });
                })
            );

            await Promise.all(
                uploads.map(async ({ file, uploadID, mimeType }) =>
                    fileUpload
                        .start(file, file.name, mimeType, shareId, uploadID)
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

        if (!validateFileName(fileName)) return;
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

    // Flag off → preserve original `WithPaidUser` behavior (hide the field entirely for Essentials users).
    if (isPassEssentials && !essentialsUpsellEnabled) return null;

    /** Essentials upselling differs from B2C: admins get an inline upgrade link while members
     * are pointed to their admin. Both still render existing files (e.g. attachments uploaded
     * on a previous paid plan), so the upsell lives in the `!canUseStorage` block below. */
    const upgradeLink = (
        <button
            key="upgrade-link"
            type="button"
            className="link link-focus align-baseline text-left p-0"
            onClick={() => navigateToUpgrade()}
        >
            {c('Action').t`Upgrade`}
        </button>
    );

    return (
        <Dropzone
            onDrop={(files) =>
                canUseStorage ? onAddFiles(files) : upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })
            }
            // Essentials users upgrade via the inline link/admin, not the B2C upsell modal
            disabled={!online || isPassEssentials}
            border={false}
            size="small"
        >
            <div className="min-h-custom">
                <FileAttachmentsSummary
                    filesCount={files.length + filesCount}
                    onDelete={handleDeleteAll}
                    deleteDisabled={fileUpload.loading || !online}
                    hidePromotionButton={isPassEssentials}
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
                                        className="button-fluid rounded-full inline-block gap-1"
                                        shape="solid"
                                        color="weak"
                                        onClick={() => popup?.expand(pathname)}
                                        fullWidth
                                    >
                                        {c('Pass_file_attachments').t`Open new window to upload files`}
                                        <IcArrowWithinSquare className="shrink-0" />
                                    </Button>
                                </div>
                            </Tooltip>
                        ) : (
                            <FileInput
                                /** Disable the "accept" attribute on iOS because the
                                 * "accept" attribute does not support the extension */
                                {...(isIos() ? {} : { accept: '*' })}
                                className="button-fluid m-4 rounded-full"
                                onChange={({ target }) => onAddFiles([...(target.files ?? [])])}
                                disabled={!online}
                                shape="solid"
                                color="weak"
                                multiple
                            >
                                {c('Pass_file_attachments').t`Choose a file or drag it here`}
                            </FileInput>
                        ))}

                    {!canUseStorage &&
                        (isPassEssentials ? (
                            <Card className="mx-4 mb-4" type="primary">
                                {userIsAdmin
                                    ? c('Pass_file_attachments')
                                          .jt`This feature is not supported in your plan. ${upgradeLink}`
                                    : c('Pass_file_attachments')
                                          .t`This feature is not supported in your plan. Contact your admin to gain access.`}
                            </Card>
                        ) : (
                            <div className="m-4">
                                <Button
                                    className="button-fluid rounded-full inline-block"
                                    shape="solid"
                                    color="weak"
                                    onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS })}
                                    fullWidth
                                >
                                    {c('Pass_file_attachments').t`Choose a file or drag it here`}
                                </Button>
                            </div>
                        ))}
                </FileAttachmentsSummary>
            </div>
        </Dropzone>
    );
};
