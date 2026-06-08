import { type FC, useCallback, useRef, useState } from 'react';

import type { FieldProps } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IconName } from '@proton/icons/types';
import {
    CUSTOM_ICON_ACCEPTED_TYPES,
    CUSTOM_ICON_MAX_SIZE,
    processIconImage,
} from '@proton/pass/lib/file-attachments/custom-icon';
import type { FileAttachmentValues, FileID, Maybe, ShareId } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { resolveMimeTypeForFile, useFileUpload } from '../../../hooks/files/useFileUpload';
import { IconBox, getIconSizePx } from '../../Layout/Icon/IconBox';

type Props = FieldProps<{}, FileAttachmentValues> & {
    icon: IconName;
    shareId: ShareId;
    /** Object URL of an existing custom icon to display */
    existingIconSrc?: string;
};

export const CustomIconField: FC<Props> = ({ form, icon, shareId, existingIconSrc }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileUpload = useFileUpload();
    const { createNotification } = useNotifications();
    const [previewSrc, setPreviewSrc] = useState<Maybe<string>>();
    const [uploading, setUploading] = useState(false);
    const [uploadedFileId, setUploadedFileId] = useState<Maybe<FileID>>();

    const displaySrc = previewSrc ?? existingIconSrc;

    const handleFileSelect = useCallback(
        async (file: File) => {
            if (!CUSTOM_ICON_ACCEPTED_TYPES.includes(file.type)) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Please select a PNG, JPEG, WebP, or SVG image.`,
                });
                return;
            }

            if (file.size > CUSTOM_ICON_MAX_SIZE) {
                const maxSize = humanSize({ bytes: CUSTOM_ICON_MAX_SIZE, unit: 'KB', fraction: 0 });
                createNotification({
                    type: 'error',
                    text: c('Error').t`Image is too large. Maximum size is ${maxSize}.`,
                });
                return;
            }

            setUploading(true);

            try {
                const processed = await processIconImage(file);
                const preview = URL.createObjectURL(processed);
                setPreviewSrc(preview);

                const mimeType = await resolveMimeTypeForFile(processed);
                const uploadID = uniqueId();
                const fileID = await fileUpload.start(processed, processed.name, mimeType, shareId, uploadID);

                /** If there was a previously uploaded icon in this session, remove it */
                if (uploadedFileId) {
                    await form.setValues((values) => {
                        const toAdd = values.files.toAdd.filter((id) => id !== uploadedFileId);
                        return partialMerge(values, { files: { toAdd } });
                    });
                }

                setUploadedFileId(fileID);
                await form.setValues((values) => {
                    const toAdd = values.files.toAdd.concat([fileID]);
                    return partialMerge(values, { files: { toAdd } });
                });
            } catch {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to upload custom icon.`,
                });
                setPreviewSrc(undefined);
            } finally {
                setUploading(false);
            }
        },
        [shareId, uploadedFileId]
    );

    const handleRemove = useCallback(async () => {
        if (uploadedFileId) {
            await form.setValues((values) => {
                const toAdd = values.files.toAdd.filter((id) => id !== uploadedFileId);
                return partialMerge(values, { files: { toAdd } });
            });
            setUploadedFileId(undefined);
        }

        if (previewSrc) URL.revokeObjectURL(previewSrc);
        setPreviewSrc(undefined);
    }, [uploadedFileId, previewSrc]);

    const size = 5;

    return (
        <div className="relative shrink-0 ml-3 my-2">
            <input
                ref={fileInputRef}
                type="file"
                accept={CUSTOM_ICON_ACCEPTED_TYPES.join(',')}
                className="sr-only"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                }}
            />

            <button
                type="button"
                className="interactive-pseudo-inset rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title={c('Action').t`Set custom icon`}
            >
                <IconBox mode={displaySrc ? 'image' : 'icon'} size={size} pill>
                    {displaySrc ? (
                        <img
                            src={displaySrc}
                            alt=""
                            className="w-custom h-custom absolute inset-center object-cover"
                            style={{
                                '--w-custom': `${getIconSizePx(size)}px`,
                                '--h-custom': `${getIconSizePx(size)}px`,
                            }}
                        />
                    ) : (
                        <Icon
                            className="absolute inset-center"
                            color="var(--interaction-norm)"
                            name={icon}
                            size={size}
                        />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-norm rounded-xl opacity-60">
                            <Icon name="arrow-up-line" size={3} className="anime-spin" />
                        </div>
                    )}
                </IconBox>
            </button>

            {displaySrc && (
                <Button
                    icon
                    pill
                    size="small"
                    shape="solid"
                    color="danger"
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '-4px', '--right-custom': '-4px' }}
                    onClick={handleRemove}
                    title={c('Action').t`Remove custom icon`}
                >
                    <Icon name="cross-small" size={3} />
                </Button>
            )}
        </div>
    );
};
