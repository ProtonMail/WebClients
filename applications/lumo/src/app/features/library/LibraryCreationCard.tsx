import { memo, useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

import { ArtifactExportOverlay } from '../../components/Conversation/artifact/ArtifactExportOverlay';
import { getArtifactSourceDownloadMimeType } from '../../components/Conversation/artifact/artifactSourceDownload';
import type { ArtifactSourceDownloadFile } from '../../components/Conversation/artifact/artifactSourceDownload';
import type { ParsedArtifact } from '../../components/Conversation/artifact/parseArtifacts';
import { useArtifactFileActions } from '../../components/Conversation/artifact/useArtifactFileActions';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { useLumoSelector } from '../../redux/hooks';
import { selectAttachmentByIdOptional } from '../../redux/selectors';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import { LibraryCreationMenu } from './LibraryCreationMenu';
import { LibraryCreationThumbnail } from './LibraryCreationThumbnail';
import type { LibraryCreationEntry } from './libraryCreations';

interface Props {
    entry: LibraryCreationEntry;
}

// Memoized: entries keep their identity while unchanged (see useLibraryCreationEntries).
export const LibraryCreationCard = memo(function LibraryCreationCard({ entry }: Props) {
    const navigate = useLumoNavigate();
    const attachment = useLumoSelector(selectAttachmentByIdOptional(entry.item.localId));
    const meta = attachment?.generatedArtifactAsset;
    const bytes = attachment?.data ?? attachmentDataCache.getData(entry.item.localId);
    const content = useMemo(() => {
        return bytes ? new TextDecoder().decode(bytes) : undefined;
    }, [bytes]);

    // The synced asset is the panel's "Download source" file, so it downloads as stored. For every
    // type but presentations it is also the artifact's content, which the exports start from.
    const artifact = useMemo<ParsedArtifact | undefined>(() => {
        if (!meta || content === undefined) {
            return undefined;
        }
        return { id: meta.artifactId, type: meta.artifactType, title: meta.artifactTitle || entry.title, content };
    }, [meta, content, entry.title]);
    const filename = attachment?.filename;
    const mimeType = attachment?.mimeType;
    const sourceFile = useMemo<ArtifactSourceDownloadFile | undefined>(() => {
        if (content === undefined || !filename) {
            return undefined;
        }
        return {
            data: content,
            fileName: filename,
            mimeType: mimeType ?? getArtifactSourceDownloadMimeType(filename.split('.').pop() ?? ''),
        };
    }, [content, filename, mimeType]);

    const fileActions = useArtifactFileActions({
        artifact,
        layout: 'library',
        viewedOlderVersion: false,
        // A synced deck is the built offline HTML, not the slides the PDF and PowerPoint exports need.
        sourceOnly: meta?.artifactType === 'presentation',
        sourceFile,
    });
    const isExporting = fileActions.exportingKind !== null;

    const date = format(entry.item.createdAt, 'd MMM', { locale: dateLocale });
    const chatLabel = [entry.conversationTitle, date].filter(Boolean).join(' · ');
    const canOpen = Boolean(meta?.conversationId && meta.artifactId);

    const openInChat = () => {
        if (!meta?.conversationId || !meta.artifactId) {
            return;
        }
        const params = new URLSearchParams({ artifact: meta.artifactId });
        navigate(`/c/${meta.conversationId}?${params.toString()}`);
    };

    return (
        <div className="library-creation-card flex flex-column gap-3 min-w-0">
            <div className="relative w-full">
                <div
                    className="library-creation-thumbnail w-full rounded-xl border border-weak overflow-hidden h-custom"
                    style={{ '--h-custom': '14rem' }}
                >
                    <LibraryCreationThumbnail
                        type={entry.artifactType}
                        title={entry.title}
                        subtitle={chatLabel}
                        content={content}
                    />
                </div>
                {/* Covers the thumbnail only, which can hold an inert iframe (not allowed inside a
                    button). It stays clear of the ⋯ menu, so a click there never opens the chat. */}
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="library-creation-card-action absolute inset-0 w-full h-full rounded-xl"
                    disabled={!canOpen}
                    onClick={openInChat}
                />
                {isExporting && (
                    <div className="absolute inset-0 flex flex-column bg-norm rounded-xl overflow-hidden">
                        <ArtifactExportOverlay
                            ref={fileActions.exportOverlayRef}
                            formatLabel={fileActions.exportFormatLabel}
                        />
                    </div>
                )}
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 w-full min-w-0">
                {/* The block wrapper shrinks reliably as a flex item; a bare button can keep its
                    text width and push the ⋯ past the card's edge. */}
                <div className="flex-1 min-w-0">
                    <button
                        type="button"
                        className="library-creation-card-action block w-full p-0 text-left text-semibold color-norm text-ellipsis"
                        disabled={!canOpen}
                        aria-label={c('collider_2025:Action').t`Open ${entry.title} in its chat`}
                        onClick={openInChat}
                    >
                        {entry.title || (
                            <span
                                className="rectangle-skeleton keep-motion rounded inline-block"
                                style={{ width: '8rem', height: '0.875rem' }}
                            />
                        )}
                    </button>
                </div>
                <LibraryCreationMenu
                    title={entry.title}
                    downloadOptions={fileActions.downloadOptions}
                    saveToDriveOptions={fileActions.saveToDriveOptions}
                    onOpenChat={canOpen ? openInChat : undefined}
                    actionsDisabled={isExporting}
                />
            </div>
            {fileActions.saveToDriveModal}
        </div>
    );
});
