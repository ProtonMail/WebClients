import { act, fireEvent, getByTestId as getByTestIdDefault, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Label } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { Element } from 'proton-mail/models/element';

import { addApiMock } from '../../../helpers/test/api';
import { minimalCache } from '../../../helpers/test/cache';
import { mailTestRender } from '../../../helpers/test/render';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import { messageID } from '../../message/tests/Message.test.helpers';
import LabelDropdown, { getInitialState } from '../LabelDropdown';

const label1Name = 'Label1';
const label1ID = 'label-1-id';
const label2Name = 'Label2';
const label2ID = 'label-2-id';
const label3Name = 'Label3';
const label3ID = 'label-3-id';

const search = 'This label does not exists';

const getProps = (labelID: string | undefined = undefined, selectAll = false) => ({
    selectedIDs: [messageID],
    labelID: labelID ? labelID : MAILBOX_LABEL_IDS.INBOX,
    onClose: jest.fn(),
    onLock: jest.fn(),
    selectAll: selectAll,
});

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
    const setup = async (
        labelIDs: string[] = [],
        selectAll = false,
        currentLabelID: string | undefined = undefined
    ) => {
        minimalCache();

        const message = getMessage(labelIDs);

        const props = getProps(currentLabelID, selectAll);

        const result = await mailTestRender(<></>, {
            preloadedState: {
                categories: getModelState(
                    [
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
                        selectAll &&
                            ({
                                // Free users can create up to 3 labels, we only need 3 to test select all case
                                ID: label3ID,
                                Name: label3Name,
                                Color: ACCENT_COLORS[3],
                                Type: LABEL_TYPE.MESSAGE_LABEL,
                                Path: label3Name,
                            } as Label),
                    ].filter(isTruthy)
                ),
            },
        });
        result.store.dispatch(initialize(message));
        await result.rerender(<LabelDropdown {...props} />);
        return result;
    };

    it("should display user's labels in the dropdown", async () => {
        await setup();

        const labels = (await screen.findAllByTestId(/label-dropdown:label-checkbox-/)) as HTMLInputElement[];

        expect(labels.length).toBe(2);
        // Checkboxes are present and unchecked
        expect(labels[0].checked).toBe(false);
        expect(labels[1].checked).toBe(false);
        screen.getByText(label1Name);
        screen.getByText(label2Name);
    });

    it('should label a message', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        await setup();

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Apply the label
        const applyButton = screen.getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should unlabel a message', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/unlabel`, apiMock);

        await setup([label1ID]);

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBeTruthy();

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBeFalsy();

        // Apply the unlabel
        const applyButton = screen.getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(apiMock).toHaveBeenCalled();
    });

    it('should add the "also archive" option', async () => {
        const apiMock = jest.fn(() => ({ UndoToken: 1000 }));
        addApiMock(`mail/v4/messages/label`, apiMock);

        await setup();

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Check the also archive option
        const alsoArchiveCheckbox = screen.getByTestId('label-dropdown:also-archive') as HTMLInputElement;

        await act(async () => {
            fireEvent.click(alsoArchiveCheckbox);
        });

        // Apply the label
        const applyButton = screen.getByTestId('label-dropdown:apply');

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

        await setup();

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(checkbox1);
        });

        expect(checkbox1.checked).toBe(true);

        // Check the "always label sender's email" checkbox
        const alwaysLabelCheckbox = screen.getByTestId('label-dropdown:always-move') as HTMLInputElement;

        await act(async () => {
            fireEvent.click(alwaysLabelCheckbox);
        });

        // Apply the label
        const applyButton = screen.getByTestId('label-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        expect(labelApiMock).toHaveBeenCalled();
        expect(filterApiMock).toHaveBeenCalled();
    });

    it('should create a label from the button', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('label-dropdown:search-input');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:label-checkbox-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label button
        const createLabelButton = screen.getByTestId('label-dropdown:add-label');

        fireEvent.click(createLabelButton);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    it('should create a label from the option', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('label-dropdown:search-input');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:label-checkbox-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label option
        const createLabelOption = screen.getByTestId('label-dropdown:create-label-option');

        fireEvent.click(createLabelOption);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    it('should have label pre-selected', async () => {
        await setup([label1ID]);

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(true);

        const checkbox2 = screen.getByTestId(`label-dropdown:label-checkbox-${label2Name}`) as HTMLInputElement;

        // Check the 2nd label
        expect(checkbox2.checked).toBe(false);
    });

    it('should have no label pre-selected when select all is active', async () => {
        await setup([label1ID], true);

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(false);

        const checkbox2 = screen.getByTestId(`label-dropdown:label-checkbox-${label2Name}`) as HTMLInputElement;

        // Check the 2nd label
        expect(checkbox2.checked).toBe(false);
    });

    it('should current label pre-selected only when select all is active', async () => {
        await setup([label1ID, label3ID], true, label1ID);

        const checkbox1 = screen.getByTestId(`label-dropdown:label-checkbox-${label1Name}`) as HTMLInputElement;

        // Check the first label
        expect(checkbox1.checked).toBe(true);

        const checkbox2 = screen.getByTestId(`label-dropdown:label-checkbox-${label2Name}`) as HTMLInputElement;

        // Check the 2nd label
        expect(checkbox2.checked).toBe(false);

        const checkbox3 = screen.getByTestId(`label-dropdown:label-checkbox-${label3Name}`) as HTMLInputElement;

        // Check the 3rd label
        expect(checkbox3.checked).toBe(false);
    });

    describe('helper functions', () => {
        const labelID1 = 'label1';
        const labelID2 = 'label2';
        const labelID3 = 'label3';
        const labelID4 = 'label4';
        const labels: Label[] = [
            { ID: labelID1, Name: 'Label 1' } as Label,
            { ID: labelID2, Name: 'Label 2' } as Label,
            { ID: labelID3, Name: 'Label 3' } as Label,
            { ID: labelID4, Name: 'Label 4' } as Label,
        ];

        const elements: Element[] = [
            { ConversationID: '1', LabelIDs: [labelID1, labelID4] } as Element,
            { ConversationID: '1', LabelIDs: [labelID1, labelID2] } as Element,
            { ConversationID: '1', LabelIDs: [labelID1] } as Element,
        ];

        describe('getInitialState', () => {
            it('should return element labels when no select all', () => {
                expect(getInitialState(labels, elements, labelID1, false)).toEqual({
                    [labelID1]: 'On',
                    [labelID2]: 'Indeterminate',
                    [labelID3]: 'Off',
                    [labelID4]: 'Indeterminate',
                });
            });

            it('should return all labels to "Indeterminate" when select all', () => {
                expect(getInitialState(labels, elements, MAILBOX_LABEL_IDS.INBOX, true)).toEqual({
                    [labelID1]: 'Indeterminate',
                    [labelID2]: 'Indeterminate',
                    [labelID3]: 'Indeterminate',
                    [labelID4]: 'Indeterminate',
                });
            });

            it('should return all labels to "Indeterminate" except current label when select all', () => {
                expect(getInitialState(labels, elements, labelID1, true)).toEqual({
                    [labelID1]: 'On',
                    [labelID2]: 'Indeterminate',
                    [labelID3]: 'Indeterminate',
                    [labelID4]: 'Indeterminate',
                });
            });
        });
    });
});
