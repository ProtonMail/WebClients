import { useEffect, useRef } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import type { ResourceLimitError, ResourceLimitType } from '../redux/slices/meta/errors';
import { dismissResourceLimitError, selectResourceLimitErrors } from '../redux/slices/meta/errors';
import { limitResourceToErrorType, onComposerError } from '../remote/nativeComposerBridgeHelpers';
import type { ConversationId } from '../types';
import { shouldShowResourceLimitError } from './resourceLimitNotificationHelpers';

interface ConversationRouteParams {
    conversationId: ConversationId;
}

const getLimitErrorText = (error: ResourceLimitError): string => {
    const { resource, limit } = error;
    switch (resource) {
        case 'messages':
            // translator: shown when a conversation reaches the maximum number of messages allowed (e.g. 250)
            return c('collider_2025: Error')
                .t`You've reached the maximum of ${limit} messages in this conversation. Start a new conversation to continue chatting with ${LUMO_SHORT_APP_NAME}.`;
        case 'assets':
            // translator: shown when a project/space reaches the maximum number of uploaded files allowed (e.g. 100)
            return c('collider_2025: Error')
                .t`You've reached the maximum of ${limit} files in this project. Remove some files before uploading new ones.`;
        case 'conversations':
            // translator: shown when a project/space reaches the maximum number of conversations allowed (e.g. 100)
            return c('collider_2025: Error')
                .t`You've reached the maximum of ${limit} conversations in this project. Delete some to create a new one.`;
        case 'spaces':
            // translator: shown when a user reaches the maximum number of projects/spaces allowed
            return c('collider_2025: Error')
                .t`You've reached the maximum number of projects. Delete some before creating a new one.`;
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
    const shown = useRef<Set<string>>(new Set());

    useEffect(() => {
        for (const error of errors) {
            if (shown.current.has(error.id)) continue;
            shown.current.add(error.id);
            if (!shouldShowResourceLimitError(error, activeConversationId)) {
                dispatch(dismissResourceLimitError(error.id));
                continue;
            }
            createNotification({
                type: 'error',
                text: getLimitErrorText(error),
                expiration: 8000,
            });
            // Forward to the native composer bridge so mobile clients can
            // render their own native banner. No-ops on web.
            onComposerError(limitResourceToErrorType(error.resource));
            dispatch(dismissResourceLimitError(error.id));
        }
    }, [errors, createNotification, dispatch, activeConversationId]);
};

export const getApproachingLimitText = (resource: ResourceLimitType, remaining: number): string => {
    switch (resource) {
        case 'messages':
            return c('collider_2025: Warning')
                .t`You have ${remaining} messages left in this conversation before reaching the limit.`;
        case 'assets':
            return c('collider_2025: Warning')
                .t`You have ${remaining} file uploads left in this project before reaching the limit.`;
        case 'conversations':
            return c('collider_2025: Warning')
                .t`You have ${remaining} conversations left in this project before reaching the limit.`;
        case 'spaces':
            return c('collider_2025: Warning').t`You have ${remaining} projects left before reaching the limit.`;
        default:
            return '';
    }
};
