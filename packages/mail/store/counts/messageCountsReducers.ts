import { type Draft, type PayloadAction } from '@reduxjs/toolkit';

import { type ModelState } from '@proton/account';
import { isCategoryLabel, isCustomFolder, isCustomLabel, isSystemFolder } from '@proton/mail/helpers/location';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { type LabelCount } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';

import { type Element } from 'proton-mail/models/element';

export const markMessagesAsRead = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        labelID: string;
    }>
) => {
    const { elements } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedMessage = selectedElement as Message;

        if (selectedMessage.Unread === 0) {
            return;
        }

        selectedMessage.LabelIDs.forEach((selectedLabelID) => {
            const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

            if (updatedMessageCounter) {
                updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
            }
        });
    });
};

export const markMessagesAsUnread = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        labelID: string;
    }>
) => {
    const { elements } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedMessage = selectedElement as Message;

        if (selectedMessage.Unread === 1) {
            return;
        }

        selectedMessage.LabelIDs.forEach((selectedLabelID) => {
            const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

            if (updatedMessageCounter) {
                updatedMessageCounter.Unread = safeIncreaseCount(updatedMessageCounter.Unread, 1);
            }
        });
    });
};

export const labelMessages = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        sourceLabelID: string;
        targetLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, targetLabelID, folders, labels } = action.payload;
    const isFolder = isSystemFolder(targetLabelID) || isCustomFolder(targetLabelID, folders);
    const isCategory = isCategoryLabel(targetLabelID);

    elements.forEach((element) => {
        const selectedMessage = element as Message;

        if (isFolder) {
            selectedMessage.LabelIDs.forEach((selectedLabelID) => {
                if (isSystemFolder(selectedLabelID) || isCustomFolder(selectedLabelID, folders)) {
                    const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

                    if (updatedMessageCounter) {
                        updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                        if (selectedMessage.Unread === 1) {
                            updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                        }
                    }
                }

                if (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    if (
                        selectedLabelID === MAILBOX_LABEL_IDS.STARRED ||
                        selectedLabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL ||
                        isCustomLabel(selectedLabelID, labels)
                    ) {
                        const updatedMessageCounter = state.value?.find(
                            (counter) => counter.LabelID === selectedLabelID
                        );

                        if (updatedMessageCounter) {
                            updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                            if (selectedMessage.Unread === 1) {
                                updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                            }
                        }
                    }
                }
            });
        } else if (isCategory) {
            selectedMessage.LabelIDs.forEach((selectedLabelID) => {
                const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

                if (updatedMessageCounter && isCategoryLabel(selectedLabelID)) {
                    updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                    if (selectedMessage.Unread === 1) {
                        updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                    }
                }
            });
        }

        const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === targetLabelID);

        if (updatedMessageCounter) {
            updatedMessageCounter.Total = safeIncreaseCount(updatedMessageCounter.Total, 1);

            if (
                selectedMessage.Unread === 1 &&
                targetLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                targetLabelID !== MAILBOX_LABEL_IDS.SPAM
            ) {
                updatedMessageCounter.Unread = safeIncreaseCount(updatedMessageCounter.Unread, 1);
            }
        }
    });
};

export const unlabelMessages = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        sourceLabelID: string;
        targetLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, targetLabelID, labels } = action.payload;
    const isLabel = isCustomLabel(targetLabelID, labels) || targetLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }
    elements.forEach((element) => {
        const selectedMessage = element as Message;
        const messageCount = state.value?.find((counter) => counter.LabelID === targetLabelID);

        if (messageCount) {
            messageCount.Total = safeDecreaseCount(messageCount.Total, 1);

            if (selectedMessage.Unread === 1) {
                messageCount.Unread = safeDecreaseCount(messageCount.Unread, 1);
            }
        }
    });
};
