import { fireEvent } from '@testing-library/react';
import { act, getByTestId as getByTestIdDefault, screen } from '@testing-library/react';

import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Label } from '@proton/shared/lib/interfaces';

import { addApiMock } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { render } from '../../../helpers/test/render';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { initialize } from '../../../logic/messages/read/messagesReadActions';
import { store } from '../../../logic/store';
import { Breakpoints } from '../../../models/utils';
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
    breakpoints: {} as Breakpoints,
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
        addToCache('Labels', [
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
        ]);

        const message = getMessage(labelIDs);

        store.dispatch(initialize(message));

        const result = await render(<MoveDropdown {...props} />, false);
        return result;
    };

    it("should display user's folders in the dropdowm", async () => {
        const { findAllByTestId, getAllByText } = await setup();

        const folders = (await findAllByTestId(/label-dropdown:folder-radio-/)) as HTMLInputElement[];

        // Should contain default folders (Inbox, Archive, Spam, Trash) + custom folders
        expect(folders.length).toBe(6);
        expect(folders[0].checked).toBe(false);
        expect(folders[1].checked).toBe(false);
        getAllByText(folder1Name);
        getAllByText(folder2Name);
    });

    it('should move to a folder', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        const { getByTestId } = await setup();

        const radio1 = getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;

        // Check the first radio
        expect(radio1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(radio1);
        });

        expect(radio1.checked).toBe(true);

        // Apply the label
        const applyButton = getByTestId('move-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should create a folder from the button', async () => {
        const { getByTestId, queryAllByTestId } = await setup();

        // Search for a label which does not exist
        const searchInput = getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label button
        const createLabelButton = getByTestId('folder-dropdown:add-folder');

        fireEvent.click(createLabelButton);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    it('should create a folder from the option', async () => {
        const { getByTestId, queryAllByTestId } = await setup();

        // Search for a label which does not exist
        const searchInput = getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label option
        const createLabelOption = getByTestId('folder-dropdown:create-folder-option');

        fireEvent.click(createLabelOption);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });
});
