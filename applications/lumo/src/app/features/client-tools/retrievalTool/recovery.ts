import type { LumoState } from '../../../redux/store';
import { SearchService } from '../../../services/search/searchService';
import { SpaceType } from '../../../types';
import { collectRetrievalExclusions } from './exclusions';
import type { RetrievalContext, RetrievalExecutionState } from './retrievalTool';
import { isOpenToOtherSpaces, resolveSearchReach } from './searchReach';

export type RetrievalRecoveryState = Pick<
    RetrievalContext,
    'allowWideScopes' | 'chatSearch' | 'searchOtherSpaces' | 'hasLumoPlus' | 'chatAttachments'
> & {
    visibleMessageIds: string[];
    excludedAttachmentIds: string[];
    excludedDocumentIds: string[];
    execution: RetrievalExecutionState;
    analyzeEnabled?: boolean;
};

export function captureRetrievalRecovery(
    context: RetrievalContext,
    execution: RetrievalExecutionState = { calls: 0, reads: 0 }
): RetrievalRecoveryState {
    return {
        allowWideScopes: context.allowWideScopes,
        chatSearch: context.chatSearch,
        searchOtherSpaces: context.searchOtherSpaces,
        hasLumoPlus: context.hasLumoPlus,
        chatAttachments: context.chatAttachments.map(
            ({ id, spaceId, filename, uploadedAt, mimeType, markdown, driveNodeId }) => {
                return { id, spaceId, filename, uploadedAt, mimeType, markdown, driveNodeId };
            }
        ),
        visibleMessageIds: [...context.getVisibleMessageIds()],
        excludedAttachmentIds: [...context.exclusions.attachmentIds],
        excludedDocumentIds: [...context.exclusions.documentIds],
        execution: { ...execution },
        analyzeEnabled: context.analyze !== undefined,
    };
}

export function restoreRetrievalContext({
    recovery,
    conversationId,
    spaceId,
    getState,
    userId,
    analysis,
}: {
    recovery: RetrievalRecoveryState;
    conversationId: string;
    spaceId: string;
    getState: () => LumoState;
    userId?: string;
    analysis?: Pick<RetrievalContext, 'analyze' | 'signal'>;
}): RetrievalContext {
    const state = getState();
    const space = state.spaces[spaceId];
    const reach = resolveSearchReach(state.lumoUserSettings, space);
    const scopes = ['none', 'project', 'all'] as const;
    const chatSearch =
        scopes[Math.max(0, Math.min(scopes.indexOf(recovery.chatSearch), scopes.indexOf(reach.chatSearch)))];
    const index =
        recovery.allowWideScopes &&
        userId &&
        state.conversations[conversationId] &&
        !state.conversations[conversationId].ghost
            ? SearchService.get(userId)
            : undefined;
    const messages = Object.values(state.messages).filter((message) => message.conversationId === conversationId);
    const exclusions = collectRetrievalExclusions(messages, state.contextFilters.filters);
    const visibleMessageIds = new Set(recovery.visibleMessageIds);
    return {
        conversationId,
        spaceId,
        isProject: space?.spaceType === SpaceType.Project,
        allowWideScopes: Boolean(index),
        chatSearch,
        searchOtherSpaces: recovery.searchOtherSpaces && reach.searchOtherSpaces,
        hasLumoPlus: recovery.hasLumoPlus,
        chatAttachments: recovery.chatAttachments,
        exclusions: {
            attachmentIds: new Set([...recovery.excludedAttachmentIds, ...exclusions.attachmentIds]),
            documentIds: new Set([...recovery.excludedDocumentIds, ...exclusions.documentIds]),
        },
        getVisibleMessageIds: () => {
            return visibleMessageIds;
        },
        allowsSearchFromOutside: (otherSpaceId) => {
            return isOpenToOtherSpaces(otherSpaceId ? getState().spaces[otherSpaceId] : undefined);
        },
        getState,
        index,
        ...(recovery.analyzeEnabled ? analysis : {}),
    };
}
