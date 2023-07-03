import { Matcher, fireEvent } from '@testing-library/react';

import { MAILBOX_LABEL_IDS, VIEW_MODE } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { addApiMock, clearAll, waitForSpyCall } from '../../../helpers/test/helper';
import { Element } from '../../../models/element';
import { folders, labels, sendEvent, setup } from './Mailbox.test.helpers';

const [label1, label2, label3, label4] = labels;
const [folder1, folder2] = folders;

describe('Mailbox labels actions', () => {
    const conversation1 = {
        ID: 'id1',
        Labels: [
            { ID: folder1.ID, ContextTime: 3, ContextNumMessages: 1 },
            { ID: label1.ID, ContextTime: 3, ContextNumMessages: 1 },
            { ID: label2.ID, ContextTime: 3, ContextNumMessages: 1 },
        ],
        NumUnread: 1,
        NumMessages: 1,
    } as Element;
    const conversation2 = {
        ID: 'id2',
        Labels: [
            { ID: folder1.ID, ContextTime: 2, ContextNumMessages: 1 },
            { ID: label1.ID, ContextTime: 2, ContextNumMessages: 1 },
            { ID: label2.ID, ContextTime: 2, ContextNumMessages: 1 },
        ],
        NumUnread: 1,
        NumMessages: 1,
    } as Element;
    const conversation3 = {
        ID: 'id3',
        Labels: [
            { ID: folder1.ID, ContextTime: 2, ContextNumMessages: 1 },
            { ID: label1.ID, ContextTime: 1, ContextNumMessages: 1 },
            { ID: label2.ID, ContextTime: 1, ContextNumMessages: 1 },
        ],
        NumUnread: 0,
        NumMessages: 1,
    } as Element;
    const conversations = [conversation1, conversation2, conversation3];

    beforeEach(clearAll);

    describe('labels action', () => {
        const useLabelDropdown = (getByTestId: (text: Matcher) => HTMLElement, labelsToClick: string[]) => {
            const labelDropdownButton = getByTestId('toolbar:labelas');
            fireEvent.click(labelDropdownButton);

            const labelDropdownList = getByTestId('label-dropdown-list');

            labelsToClick.forEach((labelToClick) => {
                const labelCheckbox = labelDropdownList.querySelector(`[id$=${labelToClick}]`);
                if (labelCheckbox) {
                    fireEvent.click(labelCheckbox);
                }
            });

            const labelDropdownApply = getByTestId('label-dropdown:apply');
            fireEvent.click(labelDropdownApply);
        };

        const expectLabels = (
            getItems: () => HTMLElement[],
            itemLabels: { [itemID: string]: { [labelName: string]: boolean } }
        ) => {
            const items = getItems();
            const itemByID = Object.fromEntries(
                items.map((item) => [item.getAttribute('data-element-id') || '', item])
            );

            Object.entries(itemLabels).forEach(([itemID, labels]) => {
                Object.entries(labels).forEach(([labelName, action]) => {
                    if (action) {
                        expect(itemByID[itemID].textContent).toContain(labelName);
                    } else {
                        expect(itemByID[itemID].textContent).not.toContain(labelName);
                    }
                });
            });
        };

        it('should add a label to two conversations', async () => {
            const labelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            addApiMock(`mail/v4/conversations/label`, labelRequestSpy, 'put');

            const { getByTestId, getAllByTestId, getItems } = await setup({ conversations, labelID: label1.ID });

            const checkboxes = getAllByTestId('item-checkbox');
            fireEvent.click(checkboxes[0]);
            fireEvent.click(checkboxes[1]);

            useLabelDropdown(getByTestId, [label3.ID]);

            await waitForSpyCall(labelRequestSpy);

            expectLabels(getItems, {
                [conversation1.ID as string]: { [label1.Name]: true, [label3.Name]: true },
                [conversation2.ID as string]: { [label1.Name]: true, [label3.Name]: true },
                [conversation3.ID as string]: { [label1.Name]: true, [label3.Name]: false },
            });

            expect(labelRequestSpy).toHaveBeenCalled();
            // @ts-ignore
            const { url, method, data } = labelRequestSpy.mock.calls[0][0];
            expect({ url, method, data }).toEqual({
                url: 'mail/v4/conversations/label',
                method: 'put',
                data: { IDs: [conversation1.ID, conversation2.ID], LabelID: label3.ID },
            });
        });

        it('should remove a label to two conversations', async () => {
            const labelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            addApiMock(`mail/v4/conversations/unlabel`, labelRequestSpy, 'put');

            const { getByTestId, getAllByTestId, getItems } = await setup({ conversations, labelID: label1.ID });

            const checkboxes = getAllByTestId('item-checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(checkboxes[2]);

            useLabelDropdown(getByTestId, [label2.ID]);

            await waitForSpyCall(labelRequestSpy);

            expectLabels(getItems, {
                [conversation1.ID as string]: { [label2.Name]: true },
                [conversation2.ID as string]: { [label2.Name]: false },
                [conversation3.ID as string]: { [label2.Name]: false },
            });

            expect(labelRequestSpy).toHaveBeenCalled();
            // @ts-ignore
            const { url, method, data } = labelRequestSpy.mock.calls[0][0];
            expect({ url, method, data }).toEqual({
                url: 'mail/v4/conversations/unlabel',
                method: 'put',
                data: { IDs: [conversation2.ID, conversation3.ID], LabelID: label2.ID },
            });
        });

        it('should add and remove a label of a conversation', async () => {
            const labelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            const unlabelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            addApiMock(`mail/v4/conversations/label`, labelRequestSpy, 'put');
            addApiMock(`mail/v4/conversations/unlabel`, unlabelRequestSpy, 'put');

            const { getByTestId, getAllByTestId, getItems } = await setup({ conversations, labelID: label1.ID });

            const checkboxes = getAllByTestId('item-checkbox');
            fireEvent.click(checkboxes[0]);

            useLabelDropdown(getByTestId, [label2.ID, label3.ID]);

            await waitForSpyCall(labelRequestSpy);
            await waitForSpyCall(unlabelRequestSpy);

            expectLabels(getItems, {
                [conversation1.ID as string]: {
                    [label1.Name]: true,
                    [label2.Name]: false,
                    [label3.Name]: true,
                    [label4.Name]: false,
                },
                [conversation2.ID as string]: {
                    [label1.Name]: true,
                    [label2.Name]: true,
                    [label3.Name]: false,
                    [label4.Name]: false,
                },
            });
        });
    });

    describe('folders action', () => {
        const useMoveDropdown = (getByTestId: (text: Matcher) => HTMLElement, folderID: string) => {
            const moveDropdownButton = getByTestId('toolbar:moveto');
            fireEvent.click(moveDropdownButton);

            const moveDropdownList = getByTestId('move-dropdown-list');

            const folderButton = moveDropdownList.querySelector(`[id$=${folderID}]`);
            if (folderButton) {
                fireEvent.click(folderButton);
            }

            const moveDropdownApply = getByTestId('move-dropdown:apply');
            fireEvent.click(moveDropdownApply);
        };

        it('should move two conversations in a another folder', async () => {
            const labelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            addApiMock(`mail/v4/conversations/label`, labelRequestSpy, 'put');

            const { getByTestId, getAllByTestId, getItems } = await setup({ conversations, labelID: folder1.ID });

            const checkboxes = getAllByTestId('item-checkbox');
            fireEvent.click(checkboxes[0]);
            fireEvent.click(checkboxes[1]);

            addApiMock('mail/v4/conversations', () => ({ Total: 1, Conversations: [conversation3] }));

            useMoveDropdown(getByTestId, folder2.ID);

            await sendEvent({ ConversationCounts: [{ LabelID: folder1.ID, Total: 1, Unread: 0 }] });

            await waitForSpyCall(labelRequestSpy);

            const items = getItems();
            expect(items.length).toBe(1);
        });
    });

    describe('empty folder', () => {
        it('should empty a folder', async () => {
            const emptyRequestSpy = jest.fn();
            addApiMock(`mail/v4/messages/empty`, emptyRequestSpy, 'delete');

            const { getByTestId, getItems, findByTestId, queryAllByTestId } = await setup({
                conversations,
                labelID: folder1.ID,
            });

            let items = getItems();
            expect(items.length).toBe(3);

            const moreDropdown = getByTestId('toolbar:more-dropdown');
            fireEvent.click(moreDropdown);

            const emptyButton = await findByTestId('toolbar:more-empty');
            fireEvent.click(emptyButton);

            const confirmButton = await findByTestId('confirm-empty-folder');
            fireEvent.click(confirmButton);

            await waitForSpyCall(emptyRequestSpy);

            items = queryAllByTestId('message-item', { exact: false });
            expect(items.length).toBe(0);
        });
    });

    describe('delete elements', () => {
        const deleteFirstTwo = async ({
            getAllByTestId,
            getByTestId,
            deleteRequestSpy,
        }: {
            getAllByTestId: (text: Matcher) => HTMLElement[];
            getByTestId: (text: Matcher) => HTMLElement;
            deleteRequestSpy: jest.Mock;
        }) => {
            const checkboxes = getAllByTestId('item-checkbox');
            fireEvent.click(checkboxes[0]);
            fireEvent.click(checkboxes[1]);

            const deleteButton = getByTestId('toolbar:deletepermanently');
            fireEvent.click(deleteButton);

            const submitButton = getByTestId('permanent-delete-modal:submit');
            fireEvent.click(submitButton);

            await waitForSpyCall(deleteRequestSpy);
        };

        it('should delete permamently conversations', async () => {
            const deleteRequestSpy = jest.fn(() => {});
            addApiMock(`mail/v4/conversations/delete`, deleteRequestSpy, 'put');

            const trashedConversations = conversations.map((conversation) => {
                return {
                    ...conversation,
                    Labels: [{ ID: MAILBOX_LABEL_IDS.TRASH, ContextTime: 0, ContextNumMessages: 0 }],
                };
            });

            const { getAllByTestId, getByTestId, getItems } = await setup({
                conversations: trashedConversations,
                labelID: MAILBOX_LABEL_IDS.TRASH,
            });

            await deleteFirstTwo({ getAllByTestId, getByTestId, deleteRequestSpy });

            const items = getItems();
            expect(items.length).toBe(1);
        });

        it('should delete permamently messages', async () => {
            const deleteRequestSpy = jest.fn(() => {});
            addApiMock(`mail/v4/messages/delete`, deleteRequestSpy, 'put');

            const trashedMessages = conversations.map((conversation) => {
                return { ...conversation, ConversationID: 'id', LabelIDs: [MAILBOX_LABEL_IDS.TRASH] };
            });

            const { getByTestId, getAllByTestId, getItems } = await setup({
                mailSettings: { ViewMode: VIEW_MODE.SINGLE } as MailSettings,
                messages: trashedMessages,
                labelID: MAILBOX_LABEL_IDS.TRASH,
            });

            await deleteFirstTwo({ getAllByTestId, getByTestId, deleteRequestSpy });

            const items = getItems();
            expect(items.length).toBe(1);
        });

        it('should delete permamently conversations and rollback', async () => {
            const deleteRequestSpy = jest.fn(() => {
                throw new Error('failed');
            });
            addApiMock(`mail/v4/conversations/delete`, deleteRequestSpy, 'put');

            const trashedConversations = conversations.map((conversation) => {
                return {
                    ...conversation,
                    Labels: [{ ID: MAILBOX_LABEL_IDS.TRASH, ContextTime: 0, ContextNumMessages: 0 }],
                };
            });

            const { getByTestId, getAllByTestId, getItems } = await setup({
                conversations: trashedConversations,
                labelID: MAILBOX_LABEL_IDS.TRASH,
            });

            await deleteFirstTwo({ getAllByTestId, getByTestId, deleteRequestSpy });

            const items = getItems();
            expect(items.length).toBe(3);
        });
    });
});
