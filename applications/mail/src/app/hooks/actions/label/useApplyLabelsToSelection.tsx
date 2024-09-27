import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useApi, useEventManager, useNotifications } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useGetLabels } from '@proton/mail';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import type { ApplyLabelsParams } from 'proton-mail/hooks/actions/label/useApplyLabels';
import { backendActionFinished, backendActionStarted } from 'proton-mail/store/elements/elementsActions';
import { useMailDispatch } from 'proton-mail/store/hooks';

import UndoActionNotification from '../../../components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../../constants';
import { useOptimisticApplyLabels } from '../../optimistic/useOptimisticApplyLabels';
import { useCreateFilters } from '../useCreateFilters';

const getNotificationTextStarred = (isMessage: boolean, elementsCount: number) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message marked as Starred.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message marked as Starred.`,
            `${elementsCount} messages marked as Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation marked as Starred.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation marked as Starred.`,
        `${elementsCount} conversations marked as Starred.`,
        elementsCount
    );
};

const getNotificationTextRemoved = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message removed from ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from ${labelName}.`,
            `${elementsCount} messages removed from ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation removed from ${labelName}.`,
        `${elementsCount} conversations removed from ${labelName}.`,
        elementsCount
    );
};

interface ApplyLabelsToSelectionParams extends ApplyLabelsParams {
    isMessage: boolean;
}

const getNotificationTextAdded = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message added to ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message added to ${labelName}.`,
            `${elementsCount} messages added to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation added to ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation added to ${labelName}.`,
        `${elementsCount} conversations added to ${labelName}.`,
        elementsCount
    );
};

export class ApplyLabelsError extends Error {
    errors: any;

    constructor(errors: any[]) {
        super();
        this.errors = errors;
        Object.setPrototypeOf(this, ApplyLabelsError.prototype);
    }
}

/**
 * If you need to use apply labels on an element selection, prefer to use the hook "useApplyLabels" with selectAll to false or undefined instead.
 */
export const useApplyLabelsToSelection = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const getLabels = useGetLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useMailDispatch();
    const { getFilterActions } = useCreateFilters();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const applyLabels = useCallback(
        async ({
            elements,
            changes,
            createFilters,
            silent = false,
            selectedLabelIDs = [],
            isMessage,
        }: ApplyLabelsToSelectionParams) => {
            if (!elements.length) {
                return;
            }
            const labels = (await getLabels()) || [];

            let undoing = false;

            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);
            const elementIDs = elements.map((element) => element.ID);
            const rollbacks = {} as { [labelID: string]: () => void };

            const { doCreateFilters, undoCreateFilters } = getFilterActions();

            const handleUndo = async (promiseTokens: Promise<PromiseSettledResult<string | undefined>[]>) => {
                try {
                    let tokens: PromiseSettledResult<string | undefined>[] = [];
                    undoing = true;
                    // Stop the event manager to prevent race conditions
                    stop();
                    Object.values(rollbacks).forEach((rollback) => rollback());

                    if (promiseTokens) {
                        tokens = await promiseTokens;
                        const filteredTokens = getFilteredUndoTokens(tokens);

                        await Promise.all([
                            ...filteredTokens.map((token) => api({ ...undoActions(token), silence: true })),
                            createFilters ? undoCreateFilters() : undefined,
                        ]);
                    }
                } finally {
                    await call();
                }
            };

            const handleDo = async () => {
                let tokens = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());

                    const errors: any[] = [];
                    const [apiResults] = await Promise.all([
                        Promise.all(
                            changesKeys.map(async (LabelID) => {
                                rollbacks[LabelID] = optimisticApplyLabels(elements, { [LabelID]: changes[LabelID] });
                                try {
                                    const action = changes[LabelID] ? labelAction : unlabelAction;
                                    return await runParallelChunkedActions({
                                        api,
                                        items: elementIDs,
                                        chunkSize: mailActionsChunkSize,
                                        action: (chunk) => action({ LabelID, IDs: chunk }),
                                    });
                                } catch (error: any) {
                                    errors.push(error);
                                }
                            })
                        ),
                        createFilters ? doCreateFilters(elements, selectedLabelIDs, false) : undefined,
                    ]);

                    // In apply labels, we send a request per label applied/removed
                    // It means that one of the request failed during the process, throwing an error too early would prevent us to Undo all actions
                    // (e.g. apply labelA and labelB. labelA fails, so we have an error, but we also need to Undo labelB.)
                    // That's why we need to wait for all api results, and throw an error when we have them all.
                    if (errors.length > 0) {
                        throw new ApplyLabelsError(errors);
                    }

                    tokens = apiResults.filter(isTruthy).flat();
                } catch (error: any) {
                    createNotification({
                        text: c('Error').t`Something went wrong. Please try again.`,
                        type: 'error',
                    });

                    if (error instanceof ApplyLabelsError) {
                        error.errors.map(async (error: any) => {
                            await handleUndo(error.data);
                        });
                    }

                    throw error;
                } finally {
                    dispatch(backendActionFinished());
                    if (!undoing) {
                        start();
                        await call();
                    }
                }
                return tokens;
            };

            // No await ==> optimistic
            const promise = handleDo();

            let notificationText = c('Success').t`Labels applied.`;

            const elementsCount = elementIDs.length;

            if (changesKeys.length === 1) {
                const labelName = labels.filter((l) => l.ID === changesKeys[0])[0]?.Name;

                if (changesKeys[0] === MAILBOX_LABEL_IDS.STARRED) {
                    notificationText = getNotificationTextStarred(isMessage, elementsCount);
                } else if (!Object.values(changes)[0]) {
                    notificationText = getNotificationTextRemoved(isMessage, elementsCount, labelName);
                } else {
                    notificationText = getNotificationTextAdded(isMessage, elementsCount, labelName);
                }
            }

            if (!silent) {
                createNotification({
                    text: (
                        <UndoActionNotification onUndo={() => handleUndo(promise)}>
                            {notificationText}
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        []
    );

    return applyLabels;
};
