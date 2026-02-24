import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { CircularProgress, FileIcon, Icon } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';

import { attachmentDataCache } from '../../../services/attachmentDataCache';
import type { Attachment } from '../../../types';
import { mimeToHuman } from '../../../util/filetypes';

import './AttachmentFileCard.scss';

// Constants
const CARD_WIDTH = '11rem';
const PREVIEW_SIZE = '2.5rem';

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
    filename: string;
    mimeTypeIcon: string;
}

const FilePreview = ({ processing, previewUrl, filename, mimeTypeIcon }: FilePreviewProps) => {
    if (processing) {
        return (
            <div
                className="mr-1 flex items-center justify-center"
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            >
                <CircularProgress progress={75} size={20} />
            </div>
        );
    }

    if (previewUrl) {
        return (
            <img
                src={previewUrl}
                alt={filename}
                className="mr-1 rounded object-cover"
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            />
        );
    }

    return <FileIcon mimeType={mimeTypeIcon} size={10} className="mr-1" />;
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
                <span className="file-card-dismiss-button bg-white rounded-full border p-1">
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
}

const FileInfo = ({ filename, prettyType, processing, autoRetrieved }: FileInfoProps) => (
    <div className="relative flex-1 flex flex-column items-start gap-0.5 min-w-0">
        <p className="m-0 text-ellipsis w-full font-medium" title={filename}>
            {filename}
        </p>
        <p className="m-0 text-xs color-weak w-full text-ellipsis" title={prettyType}>
            {processing ? c('collider_2025:Info').t`Processing...` : prettyType}
        </p>
        {autoRetrieved && (
            <span className="text-xs color-primary flex items-center gap-1 mt-0.5">
                <Icon name="magic-wand" size={3} />
                {c('collider_2025:Info').t`Auto-retrieved`}
            </span>
        )}
    </div>
);

interface ErrorDisplayProps {
    errorMessage?: string;
}

const ErrorDisplay = ({ errorMessage }: ErrorDisplayProps) => (
    <span className="flex flex-row flex-nowrap gap-2 mt-1 items-start">
        <Icon size={4} name="exclamation-triangle-filled" className="mt-0.5 shrink-0 color-danger" />
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
            onView(attachment);
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={clsx(
                'file-card group relative border border-weak p-2 bg-norm text-hint w-custom transition-all',
                canClick && 'cursor-pointer hover:border-norm hover:bg-weak',
                className
            )}
            style={{ '--w-custom': CARD_WIDTH }}
            onClick={handleCardClick}
        >
            {!readonly && onRemove && <RemoveButton processing={processing} onRemove={onRemove} />}

            <div className="flex flex-row flex-nowrap gap-2 items-start">
                <FilePreview
                    processing={processing}
                    previewUrl={previewUrl}
                    filename={filename}
                    mimeTypeIcon={mimeTypeIcon}
                />
                <FileInfo
                    filename={filename}
                    prettyType={prettyType}
                    processing={processing}
                    autoRetrieved={attachment.autoRetrieved}
                />
            </div>

            {hasError && <ErrorDisplay errorMessage={errorMessage} />}
        </div>
    );
};
