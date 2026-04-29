import { useMemo } from 'react';

import { APPROACHING_LIMIT_RATIO, RESOURCE_LIMITS, type ResourceLimitType } from '../constants/limits';
import { useLumoSelector } from '../redux/hooks';
import {
    selectAttachmentsBySpaceId,
    selectConversationsBySpaceId,
    selectMessagesByConversationId,
} from '../redux/selectors';
import type { DebugLimitOverride } from '../redux/slices/meta/errors';
import { selectDebugLimitOverride } from '../redux/slices/meta/errors';
import type { ConversationId, SpaceId } from '../types';

export interface ResourceLimitStatus {
    resource: ResourceLimitType;
    count: number;
    limit: number;
    remaining: number;
    isApproaching: boolean;
    isAtLimit: boolean;
    /** True when the status has been forced by the Debug View. */
    isDebugOverride: boolean;
}

const applyOverride = (
    resource: ResourceLimitType,
    actualCount: number,
    override: DebugLimitOverride
): { count: number; isDebugOverride: boolean } => {
    const limit = RESOURCE_LIMITS[resource];
    if (override === 'at') {
        return { count: limit, isDebugOverride: true };
    }
    if (override === 'approaching') {
        // Halfway between the approaching threshold and the hard limit.
        const threshold = Math.floor(limit * APPROACHING_LIMIT_RATIO);
        return { count: Math.min(limit - 1, threshold + Math.floor((limit - threshold) / 2)), isDebugOverride: true };
    }
    return { count: actualCount, isDebugOverride: false };
};

const buildStatus = (
    resource: ResourceLimitType,
    actualCount: number,
    override: DebugLimitOverride
): ResourceLimitStatus => {
    const limit = RESOURCE_LIMITS[resource];
    const { count, isDebugOverride } = applyOverride(resource, actualCount, override);
    const remaining = Math.max(0, limit - count);
    return {
        resource,
        count,
        limit,
        remaining,
        isApproaching: count >= Math.floor(limit * APPROACHING_LIMIT_RATIO) && count < limit,
        isAtLimit: count >= limit,
        isDebugOverride,
    };
};

export const useMessagesLimitStatus = (conversationId: ConversationId | null | undefined): ResourceLimitStatus => {
    const messages = useLumoSelector(selectMessagesByConversationId(conversationId));
    const overrideState = useLumoSelector(selectDebugLimitOverride('messages'));
    return useMemo(
        () =>
            buildStatus(
                'messages',
                Object.keys(messages).length,
                conversationId && overrideState.conversationId === conversationId ? overrideState.override : null
            ),
        [messages, conversationId, overrideState]
    );
};

export const useConversationsLimitStatus = (spaceId: SpaceId | null | undefined): ResourceLimitStatus => {
    const conversations = useLumoSelector(selectConversationsBySpaceId(spaceId));
    const overrideState = useLumoSelector(selectDebugLimitOverride('conversations'));
    return useMemo(
        () => buildStatus('conversations', Object.keys(conversations).length, overrideState.override),
        [conversations, overrideState]
    );
};

export const useAssetsLimitStatus = (spaceId: SpaceId | null | undefined): ResourceLimitStatus => {
    const attachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));
    const overrideState = useLumoSelector(selectDebugLimitOverride('assets'));
    return useMemo(
        () =>
            buildStatus(
                'assets',
                Object.keys(attachments).length,
                spaceId && overrideState.spaceId === spaceId ? overrideState.override : null
            ),
        [attachments, spaceId, overrideState]
    );
};

export const useSpacesLimitStatus = (): ResourceLimitStatus => {
    const spaces = useLumoSelector((state) => state.spaces);
    const overrideState = useLumoSelector(selectDebugLimitOverride('spaces'));
    return useMemo(
        () => buildStatus('spaces', Object.keys(spaces).length, overrideState.override),
        [spaces, overrideState]
    );
};
