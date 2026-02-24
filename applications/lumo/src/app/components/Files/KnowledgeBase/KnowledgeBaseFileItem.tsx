import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { FileIcon, Icon } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMinusCircle } from '@proton/icons/icons/IcMinusCircle';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';

import { useFileItemData } from '../fileUtils';

interface KnowledgeBaseFileItemProps {
    file: any;
    onView: (file: any, fullAttachment: any, e: React.MouseEvent) => void;
    onInclude?: () => void;
    onExclude?: () => void;
    onRemove?: (id: string) => void;
    isActive: boolean;
    readonly?: boolean;
    showToggle?: boolean;
}

export const KnowledgeBaseFileItem: React.FC<KnowledgeBaseFileItemProps> = ({
    file,
    onView,
    onInclude,
    onExclude,
    onRemove,
    isActive,
    readonly,
    showToggle = true,
}) => {
    const {
        fullAttachment,
        // hasContent,
        canView,
        mimeTypeIcon,
        prettyType,
        isTooLargeForPreview,
    } = useFileItemData(file);

    const handleFileClick = (e: React.MouseEvent) => {
        // Don't trigger preview if clicking on action buttons
        if (
            (e.target as HTMLElement).closest('[data-testid="toggle-button"]') ||
            (e.target as HTMLElement).closest('[data-testid="remove-button"]')
        ) {
            return;
        }

        if (canView && onView) {
            onView(file, fullAttachment, e);
        }
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (readonly) return; // Don't allow toggling when readonly
        if (isActive && onExclude) {
            onExclude();
        } else if (!isActive && onInclude) {
            onInclude();
        }
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove(file.id);
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={`knowledge-file-item flex flex-row flex-nowrap items-center p-1 mb-3 rounded transition-all ${readonly ? 'opacity-75' : ''} ${
                canView ? 'hover:bg-weak cursor-pointer' : 'hover:bg-weak'
            }`}
            onClick={handleFileClick}
        >
            <FileIcon mimeType={mimeTypeIcon} size={6} className="shrink-0 mr-3" />

            <div className="flex-1 min-w-0">
                <div className="flex flex-row flex-nowrap items-center gap-2 mb-1">
                    <p className="m-0 text-sm font-semibold truncate" title={file.filename}>
                        {file.filename}
                    </p>
                </div>

                <div className="flex flex-row flex-nowrap items-center">
                    <span className="text-xs color-weak">{prettyType}</span>
                    {file.isChunk && (
                        <>
                            <span className="text-xs color-weak gap-1 mr-1 ml-1">•</span>
                            <span className="text-xs color-weak">{c('collider_2025: Info').t`Partial content`}</span>
                        </>
                    )}
                    {file.autoRetrieved && (
                        <>
                            <span className="text-xs color-weak gap-1 mr-1 ml-1">•</span>
                            <span className="text-xs color-primary">{c('collider_2025: Info').t`Auto-matched`}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Action buttons - only show on hover */}
            {!readonly && (
                <div className="flex flex-row flex-nowrap items-center gap-2 ml-2">
                    {/* Status indicators - always visible */}
                    {file.processing && <Icon name="arrows-rotate" className="color-primary animate-spin" size={4} />}
                    {file.error && <Icon name="exclamation-triangle-filled" className="color-danger" size={4} />}
                    {isTooLargeForPreview && (
                        <Tooltip title={c('collider_2025: Info').t`File too large for preview (>150k tokens)`}>
                            <Icon name="exclamation-triangle-filled" className="color-warning" size={4} />
                        </Tooltip>
                    )}

                    {/* Remove button for current attachments - only show on hover */}
                    {onRemove && (
                        <Tooltip title={c('collider_2025: Info').t`Remove file`}>
                            <Button
                                size="small"
                                shape="ghost"
                                icon
                                onClick={handleRemoveClick}
                                data-testid="remove-button"
                            >
                                <IcCross size={4} />
                            </Button>
                        </Tooltip>
                    )}

                    {/* Toggle button for historical files - only show on hover */}
                    {showToggle && (onInclude || onExclude) && (
                        <Tooltip
                            title={
                                isActive
                                    ? c('collider_2025: Info').t`Exclude file`
                                    : c('collider_2025: Info').t`Add to active`
                            }
                        >
                            <Button
                                icon
                                size="small"
                                shape="ghost"
                                onClick={handleToggleClick}
                                data-testid="toggle-button"
                            >
                                {isActive ? (
                                    <IcMinusCircle size={4} className={'color-weak'} />
                                ) : (
                                    <IcPlusCircle size={4} className={'color-weak'} />
                                )}
                            </Button>
                        </Tooltip>
                    )}
                </div>
            )}
        </div>
    );
};
