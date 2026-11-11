import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { addListener } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';
import { v4 as uuidv4 } from 'uuid';

import { useNotifications } from '@proton/app-context/useNotifications';

import { useLumoDispatch } from '../redux/hooks';
import {
    type MoveConversationToSpaceFailure,
    type MoveConversationToSpaceProgress,
    moveConversationToSpaceFailure,
    moveConversationToSpaceProgress,
    moveConversationToSpaceRequest,
    moveConversationToSpaceSuccess,
} from '../redux/slices/core/conversations';
import type { ConversationId, SpaceId } from '../types';
import { sendConversationMoveToProjectEvent } from '../util/telemetry';
import { useLumoNavigate } from './useLumoNavigate';

// A move that finishes quickly shouldn't flash a progress message, so it only shows up once the move is taking a while.
const PROGRESS_DELAY_MS = 1500;

const getProgressText = ({ stage, total }: MoveConversationToSpaceProgress, projectName: string) => {
    switch (stage) {
        case 'loading':
            return c('collider_2025:Info')
                .t`Moving chat to ${projectName}: downloading its messages and files. This can take a while on a slow connection.`;
        case 'copying':
            return total
                ? c('collider_2025:Info').ngettext(
                      msgid`Moving chat to ${projectName}: saving ${total} item…`,
                      `Moving chat to ${projectName}: saving ${total} items…`,
                      total
                  )
                : c('collider_2025:Info').t`Moving chat to ${projectName}: saving the copy…`;
        case 'finishing':
            return c('collider_2025:Info').t`Moving chat to ${projectName}: finishing up…`;
    }
};

/** What to tell the person when a move fails, by the saga's failure reason. Shared with the bulk move. */
export const getMoveFailureText = (reason: MoveConversationToSpaceFailure['reason'], projectName: string) => {
    switch (reason) {
        case 'busy':
            return c('collider_2025:Error').t`Wait for the response to finish before moving this chat.`;
        case 'limit':
            return c('collider_2025:Error').t`${projectName} has reached its limit of chats or files.`;
        case 'privacy':
            return c('collider_2025:Error').t`Chats in a private project can only be moved to another private project.`;
        case 'unavailable':
            return c('collider_2025:Error').t`Some of this chat's files aren't available yet. Try again in a moment.`;
        default:
            return c('collider_2025:Error').t`Couldn't move the chat. Please try again.`;
    }
};

/**
 * Moves a chat into a project. The saga copies the chat (messages and files included) into the project, waits for
 * the copy to sync, then removes the original, so a failed move leaves the original chat untouched.
 */
// Chats being moved from this tab. The modal unmounts as soon as a project is picked, so this can't live in its state.
export const movingConversations = new Set<ConversationId>();

export const useMoveConversationToProject = (conversationId: ConversationId) => {
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const location = useLocation();
    const { createNotification, hideNotification } = useNotifications();
    const [isMoving, setIsMoving] = useState(() => movingConversations.has(conversationId));

    const moveToProject = useCallback(
        (targetSpaceId: SpaceId, projectName: string) => {
            // Reopening the modal during a slow move must not start a second attempt.
            if (movingConversations.has(conversationId)) {
                return;
            }
            movingConversations.add(conversationId);
            setIsMoving(true);
            const attemptId = uuidv4();
            const wasActive = location.pathname.includes(conversationId);
            const startedAt = Date.now();

            // One persistent message, replaced at each stage, so a slow move doesn't look stuck.
            let latestProgress: MoveConversationToSpaceProgress | undefined;
            let shownStage: MoveConversationToSpaceProgress['stage'] | undefined;
            let progressNotificationId: number | undefined;
            const showProgress = () => {
                if (!latestProgress || latestProgress.stage === shownStage) {
                    return;
                }
                if (progressNotificationId !== undefined) {
                    hideNotification(progressNotificationId);
                }
                shownStage = latestProgress.stage;
                progressNotificationId = createNotification({
                    text: getProgressText(latestProgress, projectName),
                    type: 'info',
                    expiration: -1,
                    showCloseButton: false,
                    deduplicate: false,
                });
            };
            const progressTimer = setTimeout(showProgress, PROGRESS_DELAY_MS);
            const stopProgress = () => {
                clearTimeout(progressTimer);
                latestProgress = undefined;
                if (progressNotificationId !== undefined) {
                    hideNotification(progressNotificationId);
                    progressNotificationId = undefined;
                }
            };

            const unsubscribe = dispatch(
                addListener({
                    predicate: (action) =>
                        (moveConversationToSpaceProgress.match(action) ||
                            moveConversationToSpaceSuccess.match(action) ||
                            moveConversationToSpaceFailure.match(action)) &&
                        action.payload.attemptId === attemptId,
                    effect: (action) => {
                        if (moveConversationToSpaceProgress.match(action)) {
                            latestProgress = action.payload;
                            // Once the message is up (the move is slow), keep it current.
                            if (progressNotificationId !== undefined) {
                                showProgress();
                            }
                            return;
                        }

                        stopProgress();
                        unsubscribe();
                        movingConversations.delete(conversationId);
                        setIsMoving(false);
                        const durationMs = Date.now() - startedAt;

                        if (moveConversationToSpaceSuccess.match(action)) {
                            sendConversationMoveToProjectEvent({ result: 'success', durationMs });
                            if (action.payload.cleanupFailed) {
                                createNotification({
                                    text: c('collider_2025:Warning')
                                        .t`Chat moved to ${projectName}, but the original couldn't be fully removed. You can delete it manually.`,
                                    type: 'warning',
                                });
                            } else {
                                createNotification({
                                    text: c('collider_2025:Success').t`Chat moved to ${projectName}`,
                                });
                            }
                            if (wasActive) {
                                navigate(`/c/${action.payload.newConversationId}`);
                            }
                            return;
                        }

                        if (moveConversationToSpaceFailure.match(action)) {
                            sendConversationMoveToProjectEvent({
                                result: 'failure',
                                reason: action.payload.reason ?? 'other',
                                durationMs,
                            });
                            const text = getMoveFailureText(action.payload.reason, projectName);
                            createNotification({ text, type: 'error' });
                        }
                    },
                })
            );

            dispatch(moveConversationToSpaceRequest({ conversationId, targetSpaceId, attemptId }));
        },
        [conversationId, createNotification, dispatch, hideNotification, location.pathname, navigate]
    );

    return { moveToProject, isMoving };
};
