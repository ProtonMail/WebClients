import { type Draft, type PayloadAction } from '@reduxjs/toolkit';

import { type ModelState } from '@proton/account';
import { type LabelCount } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';

import { type Element } from 'proton-mail/models/element';

import { decrementUnread, incrementUnread } from './helpers';

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
                updatedMessageCounter.Unread = decrementUnread(updatedMessageCounter.Unread, 1);
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
                updatedMessageCounter.Unread = incrementUnread(updatedMessageCounter.Unread, 1);
            }
        });
    });
};
