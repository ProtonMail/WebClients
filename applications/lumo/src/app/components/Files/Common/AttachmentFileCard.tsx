import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { CircularProgress, FileIcon } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { IcMagicWand } from '@proton/icons/icons/IcMagicWand';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { attachmentDataCache } from '../../../services/attachmentDataCache';
import type { Attachment } from '../../../types';
import { mimeToHuman } from '../../../util/filetypes';
import { isPastedContentAttachment } from '../../../util/pastedContentHelper';

import './AttachmentFileCard.scss';

// Constants
const CARD_WIDTH = '9rem';
const CARD_HEIGHT = '6.5rem';
const PREVIEW_CHARACTERS = 150;

interface AttachmentFileCardProps {
    attachment: Attachment;
    onRemove?: () => void;
    onView?: (attachment: Attachment) => void;
    className?: string;
    readonly?: boolean;
}

const createPreviewUrl = (imagePreview: Uint8Array<ArrayBuffer> | undefined): string | null => {
    if (!imagePreview || !(imagePreview instanceof Uint8Array)) {
        return null;
    }
    try {
        const blob = new Blob([imagePreview], { type: 'image/jpg' });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error('Failed to create preview URL:', e);
        return null;
    }
};

interface FilePreviewProps {
    processing?: boolean;
    previewUrl: string | null;
    previewText?: string;
    filename: string;
    mimeTypeIcon: string;
}

const FilePreview = ({ processing, previewUrl, previewText, filename, mimeTypeIcon }: FilePreviewProps) => {
    if (processing) {
        return (
            <div className="file-card-preview flex-1 min-h-0 flex items-center justify-center">
                <CircularProgress progress={75} size={28} />
            </div>
        );
    }

    if (previewUrl) {
        return (
            <div className="file-card-preview flex-1 min-h-0 overflow-hidden">
                <img src={previewUrl} alt={filename} className="w-full h-full object-cover" />
            </div>
        );
    }

    if (previewText) {
        return (
            <div className="file-card-preview file-card-preview--text flex-1 min-h-0 overflow-hidden p-3 text-xs color-weak">
                {previewText}
            </div>
        );
    }

    return (
        <div className="file-card-preview flex-1 min-h-0 flex items-center justify-center">
            <FileIcon mimeType={mimeTypeIcon} size={10} />
        </div>
    );
};

interface RemoveButtonProps {
    processing?: boolean;
    onRemove: () => void;
}

const RemoveButton = ({ processing, onRemove }: RemoveButtonProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove();
    };

    if (processing) {
        return (
            <Tooltip title={c('collider_2025:Info').t`Processing file...`}>
                <span className="file-card-dismiss-button file-card-progress bg-white rounded-full border" >
                    <CircularProgress progress={75} size={15} />
                </span>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={c('collider_2025:Action').t`Remove file`}>
            <Button
                icon
                onClick={handleClick}
                size="small"
                className="file-card-dismiss-button text-center"
                data-testid="remove-button"
            >
                <IcCross size={4} />
            </Button>
        </Tooltip>
    );
};

interface FileInfoProps {
    filename: string;
    prettyType: string;
    processing?: boolean;
    autoRetrieved?: boolean;
    mimeTypeIcon: string;
}

const FileInfo = ({ filename, prettyType, processing, autoRetrieved, mimeTypeIcon }: FileInfoProps) => (
    <div className="file-card-info">
        <FileIcon mimeType={mimeTypeIcon} size={6} className="file-card-info-icon" />
        <div className="file-card-info-text">
            <p className="m-0 text-ellipsis font-medium file-title text-xs" title={filename}>
                {filename}
            </p>
            <p className="m-0 text-xs color-weak text-ellipsis file-subtitle" title={prettyType}>
                {processing ? c('collider_2025:Info').t`Processing...` : prettyType}
            </p>
            {autoRetrieved && (
                <span className="text-xs color-primary flex items-center gap-1 mt-0.5">
                    <IcMagicWand size={3} />
                    {c('collider_2025:Info').t`Auto-retrieved`}
                </span>
            )}
        </div>
    </div>
);

interface ErrorDisplayProps {
    errorMessage?: string;
}

const ErrorDisplay = ({ errorMessage }: ErrorDisplayProps) => (
    <span className="flex flex-row flex-nowrap gap-2 mt-1 items-start">
        <IcExclamationTriangleFilled size={4} className="mt-0.5 shrink-0 color-danger" />
        <p className="text-sm m-0 color-danger">
            {errorMessage || c('collider_2025: Info').t`Error processing attachment`}
        </p>
    </span>
);

export const AttachmentFileCard = ({
    attachment,
    onRemove,
    onView,
    className,
    readonly = false,
}: AttachmentFileCardProps) => {
    const { error, processing, filename, errorMessage } = attachment;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const mimeTypeIcon = attachment.mimeType ?? 'unknown';
    const prettyType = mimeToHuman(attachment);
    const hasError = error;

    // Cleanup blob URL on unmount or when it changes
    // Re-run when processing state changes (when image finishes processing, preview becomes available)
    useEffect(() => {
        // Get imagePreview from cache instead of Redux
        const imagePreview = attachmentDataCache.getImagePreview(attachment.id);
        const url = createPreviewUrl(imagePreview);
        setPreviewUrl(url);
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
            setPreviewUrl(null);
        };
    }, [attachment.id, processing]);

    // Allow clicking for preview even if content isn't processed yet, as long as we have an onView handler
    const canClick = onView && !processing;

    const handleCardClick = () => {
        if (canClick && onView) {
            setNativeComposerVisibility(false);
            onView(attachment);
        }
    };

    const isPasted = isPastedContentAttachment(attachment);
    const isImage = !!previewUrl;

    const rawText = attachment.markdown?.trim() ?? '';
    const previewText = !isImage && rawText ? String(rawText).substring(0, PREVIEW_CHARACTERS) : undefined;

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={clsx(
                'file-card group relative border border-weak bg-norm text-hint w-custom h-custom transition-all flex flex-column',
                canClick && 'cursor-pointer hover:border-norm hover:bg-weak',
                className
            )}
            style={{ '--w-custom': CARD_WIDTH, '--h-custom': CARD_HEIGHT }}
            onClick={handleCardClick}
        >
            {!readonly && onRemove && <RemoveButton processing={processing} onRemove={onRemove} />}

            <FilePreview
                processing={processing}
                previewUrl={previewUrl}
                previewText={previewText}
                filename={filename}
                mimeTypeIcon={mimeTypeIcon}
            />

            {isPasted ? (
                <span className="file-card-pasted-badge absolute inline-block border border-weak rounded-sm px-2 py-1 text-xs font-semibold color-norm bg-norm">
                    {c('collider_2025:Info').t`PASTED`}
                </span>
            ) : (
                <div className="file-card-footer shrink-0 px-3 py-2 bg-norm overflow-hidden">
                    <FileInfo
                        filename={filename}
                        prettyType={prettyType}
                        processing={processing}
                        autoRetrieved={attachment.autoRetrieved}
                        mimeTypeIcon={mimeTypeIcon}
                    />
                </div>
            )}

            {hasError && (
                <div className="px-3 pb-2">
                    <ErrorDisplay errorMessage={errorMessage} />
                </div>
            )}
        </div>
    );
};
