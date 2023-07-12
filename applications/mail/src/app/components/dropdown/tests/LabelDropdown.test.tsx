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
import LabelDropdown from '../LabelDropdown';

const label1Name = 'Label1';
const label1ID = 'label-1-id';
const label2Name = 'Label2';
const label2ID = 'label-2-id';

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

describe('LabelDropdown', () => {
    const setup = async (labelIDs: string[] = []) => {
        minimalCache();
        addToCache('Labels', [
            {
                ID: label1ID,
                Name: label1Name,
                Color: ACCENT_COLORS[0],
                Type: LABEL_TYPE.MESSAGE_LABEL,
                Path: label1Name,
            } as Label,
            {
                ID: label2ID,
                Name: label2Name,
                Color: ACCENT_COLORS[1],
                Type: LABEL_TYPE.MESSAGE_LABEL,
                Path: label2Name,
            } as Label,
        ]);

        const message = getMessage(labelIDs);

        store.dispatch(initialize(message));

        const result = await render(<LabelDropdown {...props} />, false);
        return result;
    };

    it("should display user's labels in the dropdown", async () => {
        const { findAllByTestId, getByText } = await setup();

        const labels = (await findAllByTestId(/label-dropdown:label-checkbox-/)) as HTMLInputElement[];

        expect(labels.length).toBe(2);
        // Checkboxes are present and unchecked
        expect(labels[0].checked).toBe(false);
        expect(labels[1].checked).toBe(false);
        getByText(label1Name);
        getByText(label2Name);
    });

    it('should label a message', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        const { getByTestId } = await setup();

        const checkbox1 = getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Apply the label
        const applyButton = getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should unlabel a message', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/unlabel`, apiMock);

        const { getByTestId } = await setup([label1ID]);

        const checkbox1 = getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBeTruthy();

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBeFalsy();

        // Apply the unlabel
        const applyButton = getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should add the "also archive" option', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        const { getByTestId } = await setup();

        const checkbox1 = getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Check the also archive option
        const alsoArchiveCheckbox = getByTestId('label-dropdown:also-archive') as HTMLInputElement;

        await act(async () => {
            fireEvent.click(alsoArchiveCheckbox);
        });

        // Apply the label
        const applyButton = getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label calls have been made
        // Call 1 => Apply label
        // Call 2 => Apply archive
        expect(apiMock).toHaveBeenCalledTimes(2);
        expect((apiMock.mock.calls[0] as any[])[0]?.data?.LabelID).toEqual(label1ID);
        expect((apiMock.mock.calls[1] as any[])[0]?.data?.LabelID).toEqual(MAILBOX_LABEL_IDS.ARCHIVE);
    });

    it('should add the "always label sender\'s email" option', async () => {
        const labelApiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, labelApiMock);

        const filterApiMock = jest.fn(() => ({ Filter: {} }));
        addApiMock('mail/v4/filters', filterApiMock);

        const { getByTestId } = await setup();

        const checkbox1 = getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Check the "always label sender's email" checkbox
        const alwaysLabelCheckbox = getByTestId('label-dropdown:always-move') as HTMLInputElement;

        await act(async () => {
            fireEvent.click(alwaysLabelCheckbox);
        });

        // Apply the label
        const applyButton = getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        expect(labelApiMock).toHaveBeenCalled();
        expect(filterApiMock).toHaveBeenCalled();
    });

    it('should create a label from the button', async () => {
        const { getByTestId, queryAllByTestId } = await setup();

        // Search for a label which does not exist
        const searchInput = getByTestId('label-dropdown:search-input');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = queryAllByTestId(/label-dropdown:label-checkbox-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label button
        const createLabelButton = getByTestId('label-dropdown:add-label');

        fireEvent.click(createLabelButton);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    it('should create a label from the option', async () => {
        const { getByTestId, queryAllByTestId } = await setup();

        // Search for a label which does not exist
        const searchInput = getByTestId('label-dropdown:search-input');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = queryAllByTestId(/label-dropdown:label-checkbox-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label option
        const createLabelOption = getByTestId('label-dropdown:create-label-option');

        fireEvent.click(createLabelOption);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });
});
