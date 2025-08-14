import React from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { FileIcon, Icon } from '@proton/components';
import { IcCross, IcMinusCircle, IcPlusCircle } from '@proton/icons';

import { CONTEXT_LIMITS } from '../../../../llm/utils';
import { getSizeColor, useFileItemData } from '../fileUtils';

interface KnowledgeFileItemProps {
    file: any;
    onView: (file: any, fullAttachment: any, e: React.MouseEvent) => void;
    onInclude?: () => void;
    onExclude?: () => void;
    onRemove?: (id: string) => void;
    isActive: boolean;
    readonly?: boolean;
    showToggle?: boolean;
}

export const KnowledgeFileItem: React.FC<KnowledgeFileItemProps> = ({
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
        tokenSize,
        sizeLevel,
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
        <div
            className={`knowledge-file-item flex flex-row flex-nowrap items-center p-2 mb-3 rounded transition-all ${readonly ? 'opacity-75' : ''} ${
                canView ? 'hover:bg-weak cursor-pointer' : 'hover:bg-weak'
            }`}
            onClick={handleFileClick}
        >
            {/* File icon */}
            <FileIcon mimeType={mimeTypeIcon} size={6} className="shrink-0 mr-3" />

            {/* File info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-row flex-nowrap items-center gap-2 mb-1">
                    <p
                        className="m-0 text-sm font-semibold"
                        style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            maxWidth: 'calc(85%)',
                        }}
                        title={file.filename}
                    >
                        {file.filename}
                    </p>
                </div>
                <div className="flex flex-row flex-nowrap items-center">
                    <span className="text-xs color-weak">{prettyType}</span>
                    <span className="text-xs color-weak gap-1 mr-1 ml-1">•</span>
                    <span className={`text-xs ${getSizeColor(sizeLevel)} `}>
                        {Math.round((tokenSize / CONTEXT_LIMITS.MAX_CONTEXT) * 100)}%{' '}
                        {c('collider_2025: Info').t` of space`}
                    </span>
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
