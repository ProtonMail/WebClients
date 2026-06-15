import { useCallback, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';

import { initializeNewSpaceAndConversation, sendMessage } from '../../components/Conversation/helper';
import { usePersonalization } from '../../hooks';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoDispatch } from '../../redux/hooks';
import { newAttachmentId } from '../../redux/slices/core/attachments';
import { setGhostChatMode } from '../../redux/slices/ghostChat';
import type { Attachment, ConversationId } from '../../types';
import { buildPaperTrailContext } from './buildPaperTrailContext';
import { type NormalizedExport, parseExportFile } from './parsers';
import { buildPaperTrailPrompt, getExportFilename } from './prompt';

export type PaperTrailStatus = 'idle' | 'parsing' | 'generating' | 'error';

interface StartResult {
    status: PaperTrailStatus;
    error?: string;
    conversationId?: ConversationId;
    start: (file: File) => Promise<void>;
    reset: () => void;
}

/**
 * Orchestrates the AI Paper Trail kickoff: parse the upload, build a trimmed
 * user-prompts-only context, then run the analysis in a non-persisted (ghost)
 * conversation. The caller reads the JSON result from that conversation; we never
 * navigate into the chat UI.
 */
export const useStartPaperTrail = (): StartResult => {
    const dispatch = useLumoDispatch();
    const api = useApi();
    const { personalization } = usePersonalization();
    const { smoothRendering: ffSmoothRendering } = useLumoFlags();

    const [status, setStatus] = useState<PaperTrailStatus>('idle');
    const [error, setError] = useState<string>();
    const [conversationId, setConversationId] = useState<ConversationId>();

    const reset = useCallback(() => {
        // Generation has finished by the time reset is reachable, so the persistence
        // sagas have already run (and skipped). Safe to leave ghost mode now.
        dispatch(setGhostChatMode(false));
        setStatus('idle');
        setError(undefined);
        setConversationId(undefined);
    }, [dispatch]);

    const start = useCallback(
        async (file: File) => {
            setError(undefined);
            setConversationId(undefined);
            setStatus('parsing');

            let exportData: NormalizedExport;
            try {
                exportData = await parseExportFile(file);
            } catch (e) {
                setStatus('error');
                setError(e instanceof Error ? e.message : 'Could not read this file.');
                return;
            }

            setStatus('generating');

            const context = buildPaperTrailContext(exportData);

            // In-memory attachment: `markdown` is what gets flattened into the LLM context.
            const attachment: Attachment = {
                id: newAttachmentId(),
                mimeType: 'text/markdown',
                uploadedAt: new Date().toISOString(),
                rawBytes: context.text.length,
                processing: false,
                filename: getExportFilename(context.stats.source),
                markdown: context.text,
            };

            // Honor "we won't store a thing": run the analysis off the record.
            dispatch(setGhostChatMode(true));

            const createdAt = new Date().toISOString();
            const ids = dispatch(initializeNewSpaceAndConversation(createdAt, true));
            setConversationId(ids.conversationId);

            try {
                await dispatch(
                    sendMessage({
                        applicationContext: { api, signal: new AbortController().signal },
                        newMessageData: { content: buildPaperTrailPrompt(context), attachments: [attachment] },
                        conversationContext: {
                            spaceId: ids.spaceId,
                            conversationId: ids.conversationId,
                            allConversationAttachments: [attachment],
                            messageChain: [],
                            contextFilters: [],
                        },
                        // No navigateCallback: the result renders on this standalone page.
                        uiContext: {
                            enableExternalTools: false,
                            enableImageTools: false,
                            enableSmoothing: ffSmoothRendering,
                            isGhostMode: true,
                        },
                        settingsContext: { personalization },
                    })
                );
            } catch (e) {
                setStatus('error');
                setError(e instanceof Error ? e.message : 'Something went wrong starting the analysis.');
            }
        },
        [api, dispatch, personalization, ffSmoothRendering]
    );

    return { status, error, conversationId, start, reset };
};
