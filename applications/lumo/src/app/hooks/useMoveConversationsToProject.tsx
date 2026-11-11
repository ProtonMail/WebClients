import { useCallback } from 'react';

import { addListener } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';
import { v4 as uuidv4 } from 'uuid';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';

import { useLumoDispatch } from '../redux/hooks';
import {
    type MoveConversationToSpaceFailure,
    moveConversationToSpaceFailure,
    moveConversationToSpaceRequest,
    moveConversationToSpaceSuccess,
} from '../redux/slices/core/conversations';
import type { ConversationId, SpaceId } from '../types';
import { sendConversationMoveToProjectEvent } from '../util/telemetry';
import { useLumoNavigate } from './useLumoNavigate';
import { getMoveFailureText, movingConversations } from './useMoveConversationToProject';

// Same as the single move: a batch that finishes quickly shouldn't flash a progress message.
const PROGRESS_DELAY_MS = 1500;

type MoveResult = { ok: true } | { ok: false; reason: MoveConversationToSpaceFailure['reason'] };

/**
 * Moves several chats into a project, for the All chats selection bar. Each chat goes through the
 * same saga as a single move (copy into the project, wait for sync, remove the original). They run
 * one after another: every move downloads and re-uploads the chat's messages and files, and counts
 * against the project's limits, so running them side by side would only compete for both.
 *
 * Shows one progress message for the whole batch once it is slow, then one result message with
 * View, which opens the project.
 */
export const useMoveConversationsToProject = () => {
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { createNotification, hideNotification } = useNotifications();

    const moveOne = useCallback(
        (conversationId: ConversationId, targetSpaceId: SpaceId): Promise<MoveResult> => {
            return new Promise((resolve) => {
                const attemptId = uuidv4();
                const startedAt = Date.now();
                const unsubscribe = dispatch(
                    addListener({
                        predicate: (action) => {
                            return (
                                (moveConversationToSpaceSuccess.match(action) ||
                                    moveConversationToSpaceFailure.match(action)) &&
                                action.payload.attemptId === attemptId
                            );
                        },
                        effect: (action) => {
                            unsubscribe();
                            const durationMs = Date.now() - startedAt;

                            if (moveConversationToSpaceSuccess.match(action)) {
                                sendConversationMoveToProjectEvent({ result: 'success', durationMs });
                                resolve({ ok: true });
                                return;
                            }

                            if (moveConversationToSpaceFailure.match(action)) {
                                sendConversationMoveToProjectEvent({
                                    result: 'failure',
                                    reason: action.payload.reason ?? 'other',
                                    durationMs,
                                });
                                resolve({ ok: false, reason: action.payload.reason });
                            }
                        },
                    })
                );

                dispatch(moveConversationToSpaceRequest({ conversationId, targetSpaceId, attemptId }));
            });
        },
        [dispatch]
    );

    const moveToProject = useCallback(
        async (conversationIds: ConversationId[], targetSpaceId: SpaceId, projectName: string) => {
            // Skip chats that are already on their way somewhere, from this list or the ⋯ menu.
            const ids = conversationIds.filter((id) => {
                return !movingConversations.has(id);
            });
            if (ids.length === 0) {
                return;
            }
            ids.forEach((id) => {
                movingConversations.add(id);
            });

            const total = ids.length;
            let done = 0;
            let progressNotificationId: number | undefined;
            const showProgress = () => {
                if (progressNotificationId !== undefined) {
                    hideNotification(progressNotificationId);
                }
                const current = done + 1;
                progressNotificationId = createNotification({
                    text: c('collider_2025:Info').ngettext(
                        msgid`Moving ${current} of ${total} chat to ${projectName}…`,
                        `Moving ${current} of ${total} chats to ${projectName}…`,
                        total
                    ),
                    type: 'info',
                    expiration: -1,
                    showCloseButton: false,
                    deduplicate: false,
                });
            };
            const progressTimer = setTimeout(showProgress, PROGRESS_DELAY_MS);

            const failures: MoveResult[] = [];
            for (const id of ids) {
                const result = await moveOne(id, targetSpaceId);
                movingConversations.delete(id);
                done += 1;
                if (!result.ok) {
                    failures.push(result);
                }
                // Once the message is up (the batch is slow), keep its count current.
                if (progressNotificationId !== undefined && done < total) {
                    showProgress();
                }
            }

            clearTimeout(progressTimer);
            if (progressNotificationId !== undefined) {
                hideNotification(progressNotificationId);
            }

            const moved = total - failures.length;
            const viewButton = (
                <Button
                    shape="underline"
                    color="norm"
                    size="small"
                    className="ml-2 p-0 text-semibold"
                    onClick={() => {
                        navigate(`/projects/${targetSpaceId}`);
                    }}
                >
                    {c('collider_2025:Action').t`View`}
                </Button>
            );

            if (failures.length === 0) {
                createNotification({
                    text: (
                        <>
                            {c('collider_2025:Success').ngettext(
                                msgid`${moved} chat moved to ${projectName}`,
                                `${moved} chats moved to ${projectName}`,
                                moved
                            )}
                            {viewButton}
                        </>
                    ),
                });
                return;
            }

            // One reason for every failure gets its specific advice; mixed reasons get the general one.
            const reasons = new Set(
                failures.map((failure) => {
                    return failure.ok ? undefined : failure.reason;
                })
            );
            const reasonText = getMoveFailureText(reasons.size === 1 ? [...reasons][0] : undefined, projectName);

            if (moved === 0) {
                createNotification({ text: reasonText, type: 'error' });
                return;
            }

            const failed = failures.length;
            createNotification({
                type: 'warning',
                text: (
                    <>
                        {c('collider_2025:Warning').ngettext(
                            msgid`${moved} of ${total} chat moved to ${projectName}.`,
                            `${moved} of ${total} chats moved to ${projectName}.`,
                            total
                        )}{' '}
                        {c('collider_2025:Warning').ngettext(
                            msgid`${failed} couldn't be moved: ${reasonText}`,
                            `${failed} couldn't be moved: ${reasonText}`,
                            failed
                        )}
                        {viewButton}
                    </>
                ),
            });
        },
        [createNotification, hideNotification, moveOne, navigate]
    );

    return { moveToProject };
};
