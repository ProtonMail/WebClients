import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcFileSlash } from '@proton/icons/icons/IcFileSlash';

import { attachmentDataCache } from '../../../services/attachmentDataCache';
import type { Attachment } from '../../../types';
import { Role } from '../../../types';
import { isFileTypeSupported, mimeToHuman } from '../../../util/filetypes';
import { LazyProgressiveMarkdownRenderer } from '../../LumoMarkdown/LazyMarkdownComponents';

interface FilePreviewPanelProps {
    attachment: Attachment;
    onBack: () => void;
    onClose: () => void;
}

const MAX_DISPLAY_CHARS = 20000;

const getFileSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const parseCSVContent = (content: string): string[][] => {
    const lines = content.split('\n').filter((line) => line.trim());
    const rows: string[][] = [];
    for (const line of lines) {
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
                    i++;
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
        row.push(current.trim());
        rows.push(row);
    }
    return rows;
};

export const FilePreviewPanel = ({ attachment, onBack, onClose }: FilePreviewPanelProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const truncatedContent = useMemo(() => {
        if (!attachment.markdown) return { content: '', truncated: false, remaining: 0 };
        if (attachment.markdown.length <= MAX_DISPLAY_CHARS) {
            return { content: attachment.markdown, truncated: false, remaining: 0 };
        }
        const lastNewline = attachment.markdown.lastIndexOf('\n', MAX_DISPLAY_CHARS);
        const truncateAt = lastNewline > 0 ? lastNewline : MAX_DISPLAY_CHARS;
        return {
            content: attachment.markdown.substring(0, truncateAt),
            truncated: true,
            remaining: attachment.markdown.length - truncateAt,
        };
    }, [attachment.markdown]);

    const attachmentMimeType = attachment.mimeType;
    const isImage = attachmentMimeType?.startsWith('image/');

    const isCSVOrExcel =
        attachmentMimeType === 'text/csv' ||
        attachmentMimeType === 'application/csv' ||
        attachmentMimeType === 'application/vnd.ms-excel' ||
        attachmentMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.filename?.toLowerCase().endsWith('.csv') ||
        attachment.filename?.toLowerCase().endsWith('.xlsx') ||
        attachment.filename?.toLowerCase().endsWith('.xls');

    useEffect(() => {
        if (isImage) {
            const data = attachmentDataCache.getData(attachment.id);
            const preview = attachmentDataCache.getImagePreview(attachment.id);
            const imageData = data || preview;
            if (imageData) {
                const blob = new Blob([imageData], { type: attachmentMimeType });
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
                return () => URL.revokeObjectURL(url);
            }
        }
    }, [isImage, attachment, attachmentMimeType]);

    const hasContent = !!(attachment.markdown && attachment.markdown.trim() !== '');
    const hasError = attachment.error;
    const isUnsupported = !isFileTypeSupported(attachment.filename, attachment.mimeType);
    const isProcessing = attachment.processing;

    const renderTableView = (content: string) => {
        try {
            const rows = parseCSVContent(content);
            if (rows.length === 0) {
                return (
                    <div className="flex flex-column items-center justify-center p-6 text-center">
                        <p className="text-sm color-weak">{c('collider_2025: Info').t`No data rows found.`}</p>
                    </div>
                );
            }
            const headers = rows[0];
            const dataRows = rows.slice(1);
            return (
                <div className="w-full overflow-auto">
                    <table className="border-collapse w-full">
                        <thead className="sticky top-0 bg-norm">
                            <tr>
                                {headers.map((header, i) => (
                                    <th
                                        key={i}
                                        className="border-r border-b border-weak bg-weak p-2 text-left text-xs font-semibold"
                                        style={{ minWidth: '120px' }}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dataRows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-weak">
                                    {headers.map((_, ci) => (
                                        <td
                                            key={ci}
                                            className="border-r border-b border-weak p-2 text-xs"
                                            style={{ minWidth: '120px' }}
                                        >
                                            {row[ci] || ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } catch {
            return (
                <div className="flex flex-column items-center justify-center p-6 text-center">
                    <p className="text-sm color-weak">
                        {c('collider_2025: Info').t`Unable to parse this file as a table.`}
                    </p>
                </div>
            );
        }
    };

    const renderContent = () => {
        if (isProcessing) {
            return (
                <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                    <p className="text-sm color-weak">{c('collider_2025: Info').t`Processing file contents...`}</p>
                </div>
            );
        }
        if (hasError) {
            return (
                <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                    <p className="text-lg mb-2">⚠️</p>
                    <p className="text-sm color-weak">
                        {c('collider_2025: Info').t`There was an error processing this file.`}
                    </p>
                </div>
            );
        }
        if (isUnsupported) {
            return (
                <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                    <p className="text-sm color-weak">
                        {mimeToHuman(attachment)}{' '}
                        {c('collider_2025: Info').t`files are not supported for content extraction.`}
                    </p>
                </div>
            );
        }
        if (imageUrl) {
            return (
                <div className="flex items-center justify-center p-4 h-full">
                    <img
                        src={imageUrl}
                        alt={attachment.filename}
                        className="max-w-full max-h-full rounded"
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            );
        }
        if (!hasContent) {
            return (
                <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                    <IcFileSlash size={8} className="color-weak mb-3" />
                    <p className="text-sm color-weak">{c('collider_2025: Info').t`No content available.`}</p>
                </div>
            );
        }

        if (isCSVOrExcel) {
            return renderTableView(attachment.markdown!);
        }
        return (
            <div className="p-4">
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
                {truncatedContent.truncated && (
                    <p className="text-xs color-weak mt-2">
                        [+{truncatedContent.remaining.toLocaleString()}{' '}
                        {c('collider_2025: Info').t`characters not shown`}]
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-column h-full">
            {/* Header */}
            <div className="shrink-0 flex flex-row items-center gap-2 p-3 pb-1">
                <Button icon size="small" shape="ghost" onClick={onBack} title={c('collider_2025: Action').t`Back`}>
                    <IcArrowLeft size={4} />
                </Button>
                <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm text-bold truncate" title={attachment.filename}>
                        {attachment.filename}
                    </p>
                    <p className="m-0 text-xs color-weak">
                        {mimeToHuman(attachment)}
                        {attachment.rawBytes ? ` • ${getFileSize(attachment.rawBytes)}` : ''}
                    </p>
                </div>
                <Button icon size="small" shape="ghost" onClick={onClose} title={c('collider_2025: Action').t`Close`}>
                    <IcCross size={4} />
                </Button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto mx-3 my-2 border border-weak bg-weak rounded-lg">
                {renderContent()}
            </div>

            {/* Footer */}
            {hasContent && !imageUrl && (
                <div className="shrink-0 flex flex-row items-center justify-space-between px-3 py-2">
                    <span className="text-xs color-weak">
                        {isCSVOrExcel
                            ? c('collider_2025: Info').t`Table view`
                            : `${attachment.markdown?.length ?? 0} ${c('collider_2025: Info').t`characters processed`}`}
                    </span>
                </div>
            )}
        </div>
    );
};
