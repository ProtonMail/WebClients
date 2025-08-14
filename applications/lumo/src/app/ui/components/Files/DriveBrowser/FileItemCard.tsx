import React from 'react';

import { Button, Tooltip } from '@proton/atoms';
import { FileIcon, Icon } from '@proton/components';
import {getFileTypeDescription, getMimeTypeFromExtension} from '../../../../util/filetypes';
import { IcFolderFilled } from '@proton/icons';
import { formatFileSize } from '../fileUtils';

export interface FileItemAction {
    icon?: React.ComponentType<{ size?: number }>;
    iconName?: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
}

export interface FileItemData {
    id: string;
    name: string;
    mimeType?: string;
    size?: number;
    type?: 'file' | 'folder';
    processing?: boolean;
    error?: boolean;
    // Additional metadata
    tokenCount?: number;
    subtitle?: string;
    // Progress for downloads
    downloadProgress?: number;
}

export interface FileItemCardProps {
    file: FileItemData;
    actions?: FileItemAction[];
    onClick?: () => void;
    isActive?: boolean;
    isSelected?: boolean;
    showProgress?: boolean;
    className?: string;
    variant?: 'default' | 'compact' | 'detailed' | 'simple';
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
    file,
    actions = [],
    onClick,
    className = '',
    variant = 'default',
}) => {
    const isClickable = !!onClick;
    const hasError = file.error;
    const isProcessing = file.processing;

    const getBaseClasses = () => {
        const base = 'flex flex-row flex-nowrap items-center transition-all cursor-pointer rounded file-item-card';

        switch (variant) {
            case 'simple':
                return `${base} p-2 mb-1`;
            case 'compact':
                return `${base} p-2 mb-1 rounded border border-weak`;
            case 'detailed':
                return `${base} p-3 mb-2 rounded-lg border border-weak`;
            default:
                return `${base} p-3 mb-1 rounded border border-weak`;
        }
    };

    const getStateClasses = () => {
        if (hasError) return 'border-danger bg-danger-weak';
        return 'hover:bg-weak';
    };

    // Use centralized functions directly - no need to redefine them
    const fileTypeDescription = getFileTypeDescription(file.name, file.mimeType);
    const detectedMimeType = getMimeTypeFromExtension(file.name);

    return (
        <div
            className={`${getBaseClasses()} ${getStateClasses()} ${className}`}
            onClick={isClickable ? onClick : undefined}
        >
            {/* File icon */}
            <div className="shrink-0 mr-3">
                {file.type === 'folder' ? (
                    <IcFolderFilled size={6} className="color-warning"/>
                ) : (
                    <FileIcon mimeType={file.mimeType || detectedMimeType} size={6} />
                )}
            </div>

            {/* File info */}
            <div className="flex flex-column flex-1 min-w-0 gap-1">
                <span
                    className={`font-semibold ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}
                    style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '85%',
                    }}
                    title={file.name}
                >
                    {file.name}
                </span>

                <div className="flex flex-row items-center gap-2 flex-nowrap">
                    <span className={`color-weak shrink-0 text-xs`}>
                        {file.subtitle ||
                            (file.type === 'file' ? fileTypeDescription : '')}
                    </span>

                    {file.size && (
                        <span className={`color-weak shrink-0 text-xs`}>
                            {formatFileSize(file.size)}
                        </span>
                    )}

                    {file.tokenCount && (
                        <span className="text-xs font-semibold color-info shrink-0">{file.tokenCount} tokens</span>
                    )}
                </div>

            </div>

            {/* Actions on the right */}
            <div className={`flex flex-row items-center gap-2 shrink-0 ${file.type === 'folder' ? 'mr-1' : ''}`}>
                {isProcessing && <Icon name="arrows-rotate" className="color-primary animate-spin" size={4} />}

                {hasError && <Icon name="exclamation-triangle-filled" className="color-danger" size={4} />}

                {actions.map((action, index) => {
                    const isDisabled = action.disabled || action.loading;
                    const ButtonComponent = (
                        <Button
                            size="small"
                            shape="ghost"
                            icon={!action.iconName}
                            onClick={action.onClick}
                            disabled={isDisabled}
                            className="opacity-70 hover:opacity-100 shrink-0"
                        >
                            {typeof action.icon === 'function' ? <action.icon /> : action.icon}
                        </Button>
                    );

                    // For disabled buttons, wrap in a span to allow tooltip to work
                    if (isDisabled) {
                        return (
                            <Tooltip key={index} title={action.label}>
                                <span style={{ display: 'inline-block' }}>
                                    {ButtonComponent}
                                </span>
                            </Tooltip>
                        );
                    }

                    return (
                        <Tooltip key={index} title={action.label}>
                            {ButtonComponent}
                        </Tooltip>
                    );
                })}

                {/* Chevron for folders */}
                {file.type === 'folder' && isClickable && <Icon name="chevron-right" className="color-weak" size={4} />}
            </div>
        </div>
    );
};
