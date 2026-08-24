import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId } from '../../../redux/selectors';
import { attachmentDataCache } from '../../../services/attachmentDataCache';
import { SearchService } from '../../../services/search/searchService';
import type { Attachment, SpaceId } from '../../../types';
import { Role } from '../../../types';
import { isAttachmentRemovedFromProjectKnowledge, storeAttachmentInRedux } from '../../../util/attachmentHelpers';
import { isFileTypeSupported, mimeToHuman } from '../../../util/filetypes';
import { isPastedContentAttachment, updatePastedContentAttachment } from '../../../util/pastedContentHelper';
import { fillAttachmentFromSearchIndex } from '../../../util/resolveProjectFiles';
import { extractSpreadsheetTableSections, parseCSVContent } from '../../../util/spreadsheetTableContent';
import { useNativeComposerVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { LazyProgressiveMarkdownRenderer } from '../../LumoMarkdown/LazyMarkdownComponents';

interface FilePreviewPanelProps {
    attachment: Attachment;
    onBack: () => void;
    onClose: () => void;
    spaceId?: SpaceId;
}

const MAX_DISPLAY_CHARS = 20000;

const getFileSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FilePreviewPanel = ({ attachment: attachmentProp, onBack, onClose, spaceId }: FilePreviewPanelProps) => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const dispatch = useLumoDispatch();
    const userId = useLumoSelector((state) => state.user?.value?.ID);
    // Always read the latest version from Redux so the panel reflects edits made via Save.
    const attachments = useLumoSelector(selectAttachments);
    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));
    const attachmentFromStore = attachments[attachmentProp.id] ?? attachmentProp;
    const [hydratedAttachment, setHydratedAttachment] = useState<Attachment | null>(null);
    const attachment = hydratedAttachment ?? attachmentFromStore;
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const isPasted = isPastedContentAttachment(attachment);
    const canEdit = isPasted && !attachment.spaceId;

    useEffect(() => {
        // Exit edit mode if the attachment switches.
        setIsEditing(false);
    }, [attachment.id]);

    useEffect(() => {
        setHydratedAttachment(null);
    }, [attachmentProp.id]);

    useEffect(() => {
        if (attachmentFromStore.markdown?.trim() || attachmentFromStore.processing || attachmentFromStore.error) {
            return;
        }
        if (!userId || !spaceId) {
            return;
        }

        let cancelled = false;

        void (async () => {
            const searchService = SearchService.get(userId);
            await searchService.ensureManifestReady();
            const filled = fillAttachmentFromSearchIndex(attachmentFromStore, searchService, spaceId);
            if (cancelled || !filled.markdown?.trim()) {
                return;
            }
            setHydratedAttachment(filled);
            storeAttachmentInRedux(dispatch, filled, false);
        })();

        return () => {
            cancelled = true;
        };
    }, [attachmentFromStore, dispatch, spaceId, userId]);

    const handleStartEdit = () => {
        setDraft(attachment.markdown ?? '');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = () => {
        const updated = updatePastedContentAttachment(attachment, draft);
        storeAttachmentInRedux(dispatch, updated, false);
        setIsEditing(false);
    };

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
    const wasRemovedFromProjectKnowledge = useMemo(
        () => isAttachmentRemovedFromProjectKnowledge(attachment, spaceAttachments, spaceId),
        [attachment, spaceAttachments, spaceId]
    );
    const handleClose = () => {
        onClose();
    };

    const renderTableView = (content: string) => {
        try {
            const sections = extractSpreadsheetTableSections(content);
            if (sections.length === 0) {
                return (
                    <div className="flex flex-column items-center justify-center p-6 text-center">
                        <p className="text-sm color-weak">{c('collider_2025: Info').t`No data rows found.`}</p>
                    </div>
                );
            }

            return (
                <div className="flex flex-column gap-4 p-2">
                    {sections.map((section, index) => {
                        const rows = parseCSVContent(section.csv);
                        if (rows.length === 0) {
                            return null;
                        }

                        const headers = rows[0];
                        const dataRows = rows.slice(1);

                        return (
                            <div key={`${section.title ?? 'sheet'}-${index}`} className="w-full overflow-auto">
                                {section.title ? <p className="text-xs font-semibold mb-2">{section.title}</p> : null}
                                <table className="border-collapse w-full">
                                    <thead className="sticky top-0 bg-norm">
                                        <tr>
                                            {headers.map((header, i) => (
                                                <th
                                                    key={i}
                                                    scope="col"
                                                    className="border-r border-b border-weak bg-weak p-2 text-left text-xs font-semibold"
                                                    style={{ minInlineSize: '7.5rem' }}
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
                                                        style={{ minInlineSize: '7.5rem' }}
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
                    })}
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
        if (isEditing) {
            return (
                <div className="flex flex-column h-full p-3 gap-2">
                    <textarea
                        className="flex-1 min-h-0 w-full p-3 border border-weak rounded bg-norm color-norm text-sm font-mono"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        spellCheck={false}
                        autoFocus
                    />
                    <div className="flex flex-row justify-end gap-2 shrink-0">
                        <Button size="small" shape="ghost" onClick={handleCancelEdit}>
                            {c('collider_2025: Action').t`Cancel`}
                        </Button>
                        <Button size="small" color="norm" onClick={handleSaveEdit}>
                            {c('collider_2025: Action').t`Save`}
                        </Button>
                    </div>
                </div>
            );
        }
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
            if (wasRemovedFromProjectKnowledge) {
                return (
                    <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                        <LumoIcon name="FileX" size={32} className="color-weak mb-3" />
                        <p className="text-sm color-weak m-0">
                            {c('collider_2025: Info').t`This file was removed from project knowledge.`}
                        </p>
                    </div>
                );
            }
            return (
                <div className="flex flex-column items-center justify-center h-full p-6 text-center">
                    <LumoIcon name="FileX" size={32} className="color-weak mb-3" />
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
                    <LumoIcon name="ArrowLeft" size={16} />
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
                {canEdit && !isEditing && (
                    <Button
                        icon
                        size="small"
                        shape="ghost"
                        onClick={handleStartEdit}
                        title={c('collider_2025: Action').t`Edit`}
                    >
                        <LumoIcon name="Pencil" size={16} />
                    </Button>
                )}
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    onClick={handleClose}
                    title={c('collider_2025: Action').t`Close`}
                >
                    <LumoIcon name="X" size={16} />
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
