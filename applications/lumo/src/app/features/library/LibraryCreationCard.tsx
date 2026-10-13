import { memo, useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { useLumoSelector } from '../../redux/hooks';
import { selectAttachmentByIdOptional } from '../../redux/selectors';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import { LibraryCreationThumbnail } from './LibraryCreationThumbnail';
import type { LibraryCreationEntry } from './libraryCreations';
import { getLibraryFormatLabel, getLibraryTypeLabel } from './libraryCreations';

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

    const date = format(entry.item.createdAt, 'd MMM', { locale: dateLocale });
    const typeLabel = entry.artifactType ? getLibraryTypeLabel(entry.artifactType) : undefined;
    const formatLabel = getLibraryFormatLabel(attachment?.filename);
    const kindLabel = [typeLabel, formatLabel].filter(Boolean).join(' · ');
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
        <div className="library-creation-card relative flex flex-column gap-3 min-w-0">
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
            <div className="flex flex-column gap-1 min-w-0">
                <span className="text-semibold color-norm text-ellipsis">
                    {entry.title || (
                        <span
                            className="rectangle-skeleton keep-motion rounded inline-block"
                            style={{ width: '8rem', height: '0.875rem' }}
                        />
                    )}
                </span>
                {kindLabel && <span className="text-sm color-weak text-ellipsis">{kindLabel}</span>}
                <span className="flex flex-row flex-nowrap items-center gap-1 text-sm color-weak min-w-0">
                    <LumoIcon name="MessageSquare" size={14} className="shrink-0" />
                    <span className="text-ellipsis">{chatLabel}</span>
                </span>
            </div>
            {/* Covers the whole card, so the inert thumbnail and the text all open the creation. */}
            <button
                type="button"
                className="library-creation-card-action absolute inset-0 w-full h-full rounded-xl"
                disabled={!canOpen}
                aria-label={c('collider_2025:Action').t`Open ${entry.title} in its chat`}
                onClick={openInChat}
            />
        </div>
    );
});
