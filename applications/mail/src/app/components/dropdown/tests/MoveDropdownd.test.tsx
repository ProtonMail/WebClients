import { act, fireEvent, getByTestId as getByTestIdDefault, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Label } from '@proton/shared/lib/interfaces';

import { addApiMock } from '../../../helpers/test/api';
import { minimalCache } from '../../../helpers/test/cache';
import { mailTestRender } from '../../../helpers/test/render';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import { messageID } from '../../message/tests/Message.test.helpers';
import MoveDropdown from '../MoveDropdown';

const folder1Name = 'Folder1';
const folder1ID = 'folder-1-id';
const folder2Name = 'Folder2';
const folder2ID = 'folder-2-id';

const search = 'This label does not exists';

const props = {
    selectedIDs: [messageID],
    labelID: MAILBOX_LABEL_IDS.INBOX,
    onClose: jest.fn(),
    onLock: jest.fn(),
};

const getMessage = (labelIDs: string[] = []) => {
    return {
        localID: messageID,
        data: {
            Sender: { Address: 'sender@sender.pm.me' },
            ConversationID: 'conversationID',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, ...labelIDs],
        },
    } as MessageState;
};

describe('MoveDropdown', () => {
    const setup = async (labelIDs: string[] = []) => {
        minimalCache();

        const message = getMessage(labelIDs);

        const view = await mailTestRender(<MoveDropdown {...props} />, {
            preloadedState: {
                categories: getModelState([
                    {
                        ID: folder1ID,
                        Name: folder1Name,
                        Color: ACCENT_COLORS[0],
                        Type: LABEL_TYPE.MESSAGE_FOLDER,
                        Path: folder1Name,
                    } as Label,
                    {
                        ID: folder2ID,
                        Name: folder2Name,
                        Color: ACCENT_COLORS[1],
                        Type: LABEL_TYPE.MESSAGE_FOLDER,
                        Path: folder2Name,
                    } as Label,
                ]),
            },
        });
        view.store.dispatch(initialize(message));
        return view;
    };

    it("should display user's folders in the dropdowm", async () => {
        await setup();

        const folders = (await screen.findAllByTestId(/label-dropdown:folder-radio-/)) as HTMLInputElement[];

        // Should contain default folders (Inbox, Archive, Spam, Trash) + custom folders
        expect(folders.length).toBe(6);
        expect(folders[0].checked).toBe(false);
        expect(folders[1].checked).toBe(false);
        screen.getAllByText(folder1Name);
        screen.getAllByText(folder2Name);
    });

    it('should move to a folder', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        await setup();

        const radio1 = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;

        // Check the first radio
        expect(radio1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(radio1);
        });

        expect(radio1.checked).toBe(true);

        // Apply the label
        const applyButton = screen.getByTestId('move-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should create a folder from the button', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label button
        const createLabelButton = screen.getByTestId('folder-dropdown:add-folder');

        fireEvent.click(createLabelButton);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    it('should create a folder from the option', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label option
        const createLabelOption = screen.getByTestId('folder-dropdown:create-folder-option');

        fireEvent.click(createLabelOption);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });
});
