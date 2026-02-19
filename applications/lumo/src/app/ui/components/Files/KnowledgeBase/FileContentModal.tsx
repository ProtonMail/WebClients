import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalProps } from '@proton/components';
import { IcFileSlash } from '@proton/icons/icons/IcFileSlash';

import { attachmentDataCache } from '../../../../services/attachmentDataCache';
import type { Attachment } from '../../../../types';
import { Role } from '../../../../types';
import { isFileTypeSupported, mimeToHuman } from '../../../../util/filetypes';
import { LazyProgressiveMarkdownRenderer } from '../../LumoMarkdown/LazyMarkdownComponents';

interface FileContentModalProps extends Omit<ModalProps, 'children'> {
    attachment: Attachment | null;
    onClose: () => void;
}

export const FileContentModal = ({ attachment, onClose, ...modalProps }: FileContentModalProps) => {
    const [showRaw, setShowRaw] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Truncate long content to prevent UI lag
    // ~80 chars per line, ~50 lines per page, ~5 pages = 20,000 chars
    const MAX_DISPLAY_CHARS = 20000;
    const truncatedContent = useMemo(() => {
        if (!attachment?.markdown) {
            return { content: '', truncated: false, remaining: 0 };
        }

        if (attachment.markdown.length <= MAX_DISPLAY_CHARS) {
            return { content: attachment.markdown, truncated: false, remaining: 0 };
        }

        // Find the last newline before the limit to truncate on line boundaries
        const lastNewline = attachment.markdown.lastIndexOf('\n', MAX_DISPLAY_CHARS);
        const truncateAt = lastNewline > 0 ? lastNewline : MAX_DISPLAY_CHARS;

        return {
            content: attachment.markdown.substring(0, truncateAt),
            truncated: true,
            remaining: attachment.markdown.length - truncateAt,
        };
    }, [attachment?.markdown]);

    // Check if this is an image
    const attachmentMimeType = attachment?.mimeType;
    const isImage = attachmentMimeType?.startsWith('image/');

    // Create and cleanup image URL
    useEffect(() => {
        if (isImage && attachment) {
            // Get image data from cache instead of Redux
            const attachmentData = attachmentDataCache.getData(attachment.id);
            const attachmentImagePreview = attachmentDataCache.getImagePreview(attachment.id);
            const imageData = attachmentData || attachmentImagePreview;
            
            if (imageData) {
                const blob = new Blob([imageData], { type: attachmentMimeType });
                const url = URL.createObjectURL(blob);
                setImageUrl(url);

                return () => {
                    URL.revokeObjectURL(url);
                };
            }
        }
    }, [isImage, attachment, attachmentMimeType]);

    if (!attachment) return null;

    const hasContent = attachment.markdown && attachment.markdown.trim() !== '';
    const hasError = attachment.error;
    const isUnsupported = !isFileTypeSupported(attachment.filename, attachment.mimeType);
    const isProcessing = attachment.processing;

    // Check if this is a CSV or Excel file
    const isCSVOrExcel =
        attachment.mimeType === 'text/csv' ||
        attachment.mimeType === 'application/csv' ||
        attachment.mimeType === 'application/vnd.ms-excel' ||
        attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.filename?.toLowerCase().endsWith('.csv') ||
        attachment.filename?.toLowerCase().endsWith('.xlsx') ||
        attachment.filename?.toLowerCase().endsWith('.xls');

    const getFileSize = (sizeBytes: number) => {
        if (sizeBytes < 1024) return `${sizeBytes} B`;
        if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
        return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const parseCSVContent = (content: string): string[][] => {
        const lines = content.split('\n').filter((line) => line.trim());
        const rows: string[][] = [];

        for (const line of lines) {
            // Simple CSV parsing - handles quoted fields and escaped quotes
            const row: string[] = [];
            let current = '';
            let inQuotes = false;
            let i = 0;

            while (i < line.length) {
                const char = line[i];

                if (char === '"' && !inQuotes) {
                    inQuotes = true;
                } else if (char === '"' && inQuotes) {
                    if (line[i + 1] === '"') {
                        current += '"';
                        i++; // Skip the next quote
                    } else {
                        inQuotes = false;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }

                i++;
            }

            // Add the last field
            row.push(current.trim());
            rows.push(row);
        }

        return rows;
    };

    const renderTableView = (content: string) => {
        try {
            const rows = parseCSVContent(content);

            if (rows.length === 0) {
                return (
                    <div className="flex flex-column items-center justify-center p-8 text-center">
                        <div className="mb-4 text-4xl">📊</div>
                        <p className="text-sm color-weak">
                            {c('collider_2025: Info').t`No data rows found in this file.`}
                        </p>
                    </div>
                );
            }

            const headers = rows[0];
            const dataRows = rows.slice(1);

            return (
                <div className="w-full">
                    <div
                        className="overflow-auto max-h-custom border border-weak rounded"
                        style={{ '--max-h-custom': '60vh' }}
                    >
                        <table className="border-collapse bg-norm" style={{ minWidth: '100%', width: 'max-content' }}>
                            <thead className="sticky top-0 bg-norm z-10">
                                <tr>
                                    {headers.map((header, index) => (
                                        <th
                                            key={index}
                                            className="border-r border-b border-weak bg-weak p-3 text-left font-semibold text-sm"
                                            style={{
                                                minWidth: '150px',
                                                maxWidth: '300px',
                                                width: 'auto',
                                            }}
                                        >
                                            <div
                                                className="whitespace-nowrap overflow-hidden text-ellipsis"
                                                title={header}
                                            >
                                                {header}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dataRows.length > 0 ? (
                                    dataRows.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-weak transition-colors">
                                            {headers.map((_, cellIndex) => (
                                                <td
                                                    key={cellIndex}
                                                    className="border-r border-b border-weak p-3 text-sm"
                                                    style={{
                                                        minWidth: '150px',
                                                        maxWidth: '300px',
                                                        width: 'auto',
                                                    }}
                                                >
                                                    <div
                                                        className="whitespace-nowrap overflow-hidden text-ellipsis"
                                                        title={row[cellIndex] || ''}
                                                    >
                                                        {row[cellIndex] || ''}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={headers.length} className="p-8 text-center color-weak">
                                            {c('collider_2025: Info').t`No data rows found`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Show row count info */}
                    <div className="mt-2 p-2 text-xs color-weak text-center">
                        {dataRows.length > 0
                            ? `${c('collider_2025: Info').t`Showing`} ${dataRows.length} ${c('collider_2025: Info').t`rows with`} ${headers.length} ${c('collider_2025: Info').t`columns`}`
                            : `${headers.length} ${c('collider_2025: Info').t`columns found, no data rows`}`}
                    </div>

                    {/* Show truncation info if available */}
                    {attachment.truncated && attachment.originalRowCount && attachment.processedRowCount && (
                        <div className="mt-2 p-3 bg-info-weak border border-info rounded text-sm">
                            <strong>{c('collider_2025: Info').t`Note:`}</strong>{' '}
                            {c('collider_2025: Info').t`Showing first`} {attachment.processedRowCount}{' '}
                            {c('collider_2025: Info').t`of`} {attachment.originalRowCount}{' '}
                            {c('collider_2025: Info').t`rows`}
                        </div>
                    )}
                </div>
            );
        } catch (error) {
            console.error('Error parsing CSV content:', error);
            return (
                <div className="flex flex-column items-center justify-center p-8 text-center">
                    <div className="mb-4 text-4xl">⚠️</div>
                    <h3 className="text-lg font-semibold mb-2">{c('collider_2025: Info').t`Error Parsing Table`}</h3>
                    <p className="text-sm color-weak">
                        {c('collider_2025: Info')
                            .t`Unable to parse this file as a table. You can view the raw content instead.`}
                    </p>
                </div>
            );
        }
    };

    const renderContent = () => {
        if (isProcessing) {
            return (
                <div className="flex flex-column items-center justify-center p-8 text-center">
                    <div className="mb-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <p className="text-sm color-weak">{c('collider_2025: Info').t`Processing file contents...`}</p>
                </div>
            );
        }

        if (hasError) {
            return (
                <div className="flex flex-column items-center justify-center p-8 text-center">
                    <div className="mb-4 text-4xl">⚠️</div>
                    <h3 className="text-lg font-semibold mb-2">{c('collider_2025: Info').t`Error Processing File`}</h3>
                    <p className="text-sm color-weak">
                        {c('collider_2025: Info')
                            .t`There was an error processing this file. The content may not be readable or the file format might not be fully supported.`}
                    </p>
                </div>
            );
        }

        if (isUnsupported) {
            const fileType = mimeToHuman(attachment);
            return (
                <div className="flex flex-column items-center justify-center p-8 text-center">
                    <div className="mb-4 text-4xl">📄</div>
                    <h3 className="text-lg font-semibold mb-2">{c('collider_2025: Info').t`Unsupported File Type`}</h3>
                    <p className="text-sm color-weak">
                        {fileType}{' '}
                        {c('collider_2025: Info').t`files are not currently supported for content extraction.`}
                    </p>
                </div>
            );
        }

        // Show image if available
        if (imageUrl) {
            const hasFullResolution = attachmentDataCache.hasData(attachment.id);
            const hasPreviewOnly = !hasFullResolution && attachmentDataCache.hasImagePreview(attachment.id);
            
            return (
                <div className="flex flex-column items-center justify-center p-4">
                    <img
                        src={imageUrl}
                        alt={attachment.filename}
                        className="max-w-full max-h-custom rounded"
                        style={{ '--max-h-custom': '70vh', objectFit: 'contain' }}
                    />
                    {hasPreviewOnly && (
                        <p className="text-xs color-weak mt-2">
                            {c('collider_2025: Info').t`Preview quality - full resolution not loaded`}
                        </p>
                    )}
                </div>
            );
        }

        if (!hasContent) {
            return (
                <div className="flex flex-column items-center justify-center p-8 text-center">
                    <div className="mb-4">
                        <IcFileSlash size={8} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{c('collider_2025: Info').t`No Content Available`}</h3>
                    <p className="text-sm color-weak">
                        {c('collider_2025: Info')
                            .t`This file appears to be empty or contains no extractable text content.`}
                    </p>
                </div>
            );
        }

        if (showRaw) {
            return (
                <div className="flex flex-column">
                    <div
                        className="bg-weak p-4 rounded border font-mono text-sm overflow-auto --max-h-custom"
                        // style={{ '--max-h-custom': isCSVOrExcel ? '60vh' : '70vh' }}
                    >
                        <pre className="whitespace-pre-wrap break-words m-0">{truncatedContent.content}</pre>
                    </div>
                    {truncatedContent.truncated && (
                        <div className="pt-2 pb-4 px-6 text-sm color-weak">
                            [+{truncatedContent.remaining.toLocaleString()}{' '}
                            {c('collider_2025: Info').t`characters not shown`}]
                        </div>
                    )}
                </div>
            );
        }

        // Show table view for CSV/Excel files, markdown for others
        if (isCSVOrExcel) {
            return renderTableView(attachment.markdown!);
        }

        return (
            <div className="flex flex-column">
                <div
                    className="prose prose-sm max-w-none overflow-auto p-6 --max-h-custom"
                    // style={{ '--max-h-custom': '70vh' }}
                >
                    <LazyProgressiveMarkdownRenderer
                        content={truncatedContent.content}
                        isStreaming={false}
                        message={{
                            id: 'file-content',
                            content: truncatedContent.content,
                            role: Role.Assistant,
                            conversationId: '',
                            createdAt: new Date().toISOString(),
                        }}
                    />
                </div>
                {truncatedContent.truncated && (
                    <div className="pt-2 pb-4 px-6 text-sm color-weak">
                        [+{truncatedContent.remaining.toLocaleString()}{' '}
                        {c('collider_2025: Info').t`characters not shown`}]
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {isCSVOrExcel && (
                <style>
                    {`
                        .file-content-modal-extra-wide .modal-two,
                        .file-content-modal-extra-wide .modal-two-dialog,
                        .file-content-modal-extra-wide .modal-two-inner {
                            max-width: 99vw !important;
                            width: 99vw !important;
                            margin: 0.5vh auto !important;
                        }
                        .file-content-modal-extra-wide .modal-two-content {
                            padding: 0.5rem !important;
                            max-width: none !important;
                        }
                        .file-content-modal-extra-wide .modal-two-header {
                            padding: 1rem 1rem 0.5rem 1rem !important;
                        }
                        .file-content-modal-extra-wide .modal-two-footer {
                            padding: 0.5rem 1rem 1rem 1rem !important;
                        }
                    `}
                </style>
            )}
            <ModalTwo
                size="xlarge"
                className={isCSVOrExcel ? 'file-content-modal-extra-wide' : ''}
                {...modalProps}
                onClose={onClose}
            >
                <ModalTwoHeader
                    title={
                        <div className="flex flex-column gap-1">
                            <span className="text-lg font-semibold truncate">{attachment.filename}</span>
                            <div className="flex flex-row items-center gap-2 text-sm color-weak">
                                <span>{mimeToHuman(attachment)}</span>
                                {attachment.rawBytes && (
                                    <>
                                        <span>•</span>
                                        <span>{getFileSize(attachment.rawBytes)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    }
                />

                <ModalTwoContent>
                    {hasContent && !imageUrl && (
                        <div className="flex flex-row justify-space-between items-center mb-4 p-2 bg-weak rounded">
                            <span className="text-sm color-weak">
                                {isCSVOrExcel && !showRaw
                                    ? c('collider_2025: Info').t`Table view`
                                    : `${c('collider_2025: Info').t`Processed content`} (${attachment.markdown?.length || 0} ${c('collider_2025: Info').t`characters`})`}
                            </span>
                            <Button size="small" shape="outline" onClick={() => setShowRaw(!showRaw)}>
                                {/* eslint-disable-next-line no-nested-ternary */}
                                {showRaw
                                    ? isCSVOrExcel
                                        ? c('collider_2025: Info').t`Show Table`
                                        : c('collider_2025: Info').t`Show Formatted`
                                    : c('collider_2025: Info').t`Show Raw`}
                            </Button>
                        </div>
                    )}

                    <div className="border border-weak rounded">{renderContent()}</div>
                </ModalTwoContent>

                <ModalTwoFooter>
                    <Button onClick={onClose}>{c('collider_2025: Info').t`Close`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};
