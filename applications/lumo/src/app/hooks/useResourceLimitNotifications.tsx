import { useEffect, useRef } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectConversationById } from '../redux/selectors';
import type { ResourceLimitError, ResourceLimitType } from '../redux/slices/meta/errors';
import { dismissResourceLimitError, selectResourceLimitErrors } from '../redux/slices/meta/errors';
import { limitResourceToErrorType, onComposerError } from '../remote/nativeComposerBridgeHelpers';
import type { ConversationId } from '../types';
import { shouldShowResourceLimitError } from './resourceLimitNotificationHelpers';

interface ConversationRouteParams {
    conversationId: ConversationId;
}

const getLimitErrorText = (error: ResourceLimitError, isProjectSpace = true): string => {
    const { resource } = error;
    switch (resource) {
        case 'messages':
            // translator: shown when a conversation gets too long to stay responsive. Reassures the user this is about performance, not a plan limit.
            return c('collider_2025: Error')
                .t`This conversation is too long to continue. Start a new chat to keep ${LUMO_SHORT_APP_NAME} purring and responsive.`;
        case 'assets':
            if (!isProjectSpace) {
                // translator: shown when a chat has as many files as it can handle while staying responsive. This is a performance limit, not a plan limit.
                return c('collider_2025: Error')
                    .t`That's a lot of files for ${LUMO_SHORT_APP_NAME} to juggle. Remove some from this chat before uploading new ones to keep things purring.`;
            }
            // translator: shown when a project has as many files as it can handle while staying responsive. This is a performance limit, not a plan limit.
            return c('collider_2025: Error')
                .t`That's a lot of files for ${LUMO_SHORT_APP_NAME} to juggle. Remove some from this project before uploading new ones to keep things purring.`;
        case 'conversations':
            if (!isProjectSpace) {
                // translator: shown when a chat holds as many conversations as it can while staying responsive. This is a performance limit, not a plan limit.
                return c('collider_2025: Error')
                    .t`This chat is full to the whiskers. Start a new chat to keep ${LUMO_SHORT_APP_NAME} purring.`;
            }
            // translator: shown when a project holds as many conversations as it can while staying responsive. This is a performance limit, not a plan limit.
            return c('collider_2025: Error')
                .t`This project is full to the whiskers. Delete a conversation to make room for a new one and keep ${LUMO_SHORT_APP_NAME} purring.`;
        case 'spaces':
            // translator: shown when a user has as many projects as ${LUMO_SHORT_APP_NAME} can keep responsive. This is a performance limit, not a plan limit.
            return c('collider_2025: Error')
                .t`That's all the projects ${LUMO_SHORT_APP_NAME} can keep purring at once. Delete one before creating a new one.`;
        default:
            // translator: generic fallback when a resource limit is reached
            return c('collider_2025: Error').t`You've reached a usage limit. Please try again later.`;
    }
};

/**
 * Hook that watches Redux for resource-limit errors raised by background sync
 * sagas (see LimitReachedError in api.ts / sagas) and surfaces them to the
 * user as error notifications. Each error is shown once and then dismissed
 * from state.
 */
export const useResourceLimitNotifications = () => {
    const { createNotification } = useNotifications();
    const dispatch = useLumoDispatch();
    const errors = useLumoSelector((state) => selectResourceLimitErrors({ errors: state.errors }));
    const conversationMatch = useRouteMatch<ConversationRouteParams>('/c/:conversationId');
    const activeConversationId = conversationMatch?.params.conversationId;
    const activeConversation = useLumoSelector((state) =>
        activeConversationId ? selectConversationById(activeConversationId)(state) : undefined
    );
    const activeSpaceId = activeConversation?.spaceId;
    const spaces = useLumoSelector((state) => state.spaces);
    const shown = useRef<Set<string>>(new Set());

    useEffect(() => {
        for (const error of errors) {
            if (shown.current.has(error.id)) continue;
            shown.current.add(error.id);
            if (!shouldShowResourceLimitError(error, activeConversationId)) {
                dispatch(dismissResourceLimitError(error.id));
                continue;
            }
            const errorSpaceId = error.spaceId ?? activeSpaceId;
            const errorSpace = errorSpaceId ? spaces[errorSpaceId] : undefined;
            const isProjectSpace = errorSpace ? errorSpace.isProject === true : !errorSpaceId;
            createNotification({
                type: 'error',
                text: getLimitErrorText(error, isProjectSpace),
                expiration: 8000,
            });
            // Forward to the native composer bridge so mobile clients can
            // render their own native banner. No-ops on web.
            onComposerError(limitResourceToErrorType(error.resource));
            dispatch(dismissResourceLimitError(error.id));
        }
    }, [errors, createNotification, dispatch, activeConversationId, activeSpaceId, spaces]);
};

export const getApproachingLimitText = (resource: ResourceLimitType, _remaining: number): string => {
    switch (resource) {
        case 'messages':
            // translator: shown when a conversation is getting long. Frames it as a performance hint, not a plan limit.
            return c('collider_2025: Warning')
                .t`This conversation is getting long. Start a new chat soon to keep ${LUMO_SHORT_APP_NAME} purring.`;
        case 'assets':
            // translator: shown when a project is getting close to its responsive file capacity.
            return c('collider_2025: Warning')
                .t`This project is filling up. Tidying away files you no longer need keeps ${LUMO_SHORT_APP_NAME} purring.`;
        case 'conversations':
            // translator: shown when a project is getting close to its responsive conversation capacity.
            return c('collider_2025: Warning')
                .t`This project is filling up. Tidying away conversations you no longer need keeps ${LUMO_SHORT_APP_NAME} purring.`;
        case 'spaces':
            // translator: shown when a user is getting close to the number of projects that stay responsive.
            return c('collider_2025: Warning')
                .t`You're getting close to the number of projects ${LUMO_SHORT_APP_NAME} can keep purring over.`;
        default:
            return '';
    }
};
