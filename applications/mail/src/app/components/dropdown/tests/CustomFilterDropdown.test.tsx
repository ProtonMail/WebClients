import { fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';

import { ConditionType } from '@proton/components';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { render, tick } from '../../../helpers/test/render';
import CustomFilterDropdown from '../CustomFilterDropdown';

const subject = 'Message subject';
const sender = 'sender@pm.me';
const me = 'me@pm.me';

const message = {
    Subject: subject,
    Sender: { Address: sender },
    ToList: [{ Address: me }],
} as Message;

const props = {
    message: message,
    onClose: jest.fn(),
    onLock: jest.fn(),
};

describe('CustomFilterDropdown', () => {
    it('should create a filter based on all options', async () => {
        const { getByTestId } = await render(<CustomFilterDropdown {...props} />);

        const subjectCheckbox = getByTestId(`custom-filter-checkbox:${ConditionType.SUBJECT}`) as HTMLInputElement;
        const recipientCheckbox = getByTestId(`custom-filter-checkbox:${ConditionType.RECIPIENT}`) as HTMLInputElement;
        const senderCheckbox = getByTestId(`custom-filter-checkbox:${ConditionType.SENDER}`) as HTMLInputElement;
        const attachmentCheckbox = getByTestId(
            `custom-filter-checkbox:${ConditionType.ATTACHMENTS}`
        ) as HTMLInputElement;

        // By default all options are not checked
        expect(subjectCheckbox.checked).toBeFalsy();
        expect(recipientCheckbox.checked).toBeFalsy();
        expect(senderCheckbox.checked).toBeFalsy();
        expect(attachmentCheckbox.checked).toBeFalsy();

        // Then we want to check them all (need to do it separately otherwise it fails)
        await act(async () => {
            fireEvent.click(subjectCheckbox);
            await tick();
        });
        expect(subjectCheckbox.checked).toBeTruthy();

        await act(async () => {
            fireEvent.click(recipientCheckbox);
            await tick();
        });
        expect(recipientCheckbox.checked).toBeTruthy();

        await act(async () => {
            fireEvent.click(senderCheckbox);
            await tick();
        });
        expect(senderCheckbox.checked).toBeTruthy();

        await act(async () => {
            fireEvent.click(attachmentCheckbox);
            await tick();
        });
        expect(attachmentCheckbox.checked).toBeTruthy();

        // Open the filter modal
        const applyButton = getByTestId('filter-dropdown:next-button');
        fireEvent.click(applyButton);

        /* TODO enable this part of the test when Sieve will be part of the monorepo
                For now, we are forced to mock the library which is causing issue when we want to check prefilled condition from the modal
        // Add a name to the filter so that we can pass to next step
        const filterNameInput = screen.getByTestId('filter-modal:name-input');

        await act(async () => {
            fireEvent.change(filterNameInput, {target: {value: newFilterName}});
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        const modalNextButton = screen.getByTestId('filter-modal:next-button');
        fireEvent.click(modalNextButton);

        // Check that conditions
        const conditions = screen.queryAllByTestId(/filter-modal:condition-/)
        expect(conditions.length).toEqual(4)

        // Check that option 1 is Subject with the expected value
        // Check that option 2 is Recipient with the expected value
        // Check that option 2 is Sender with the expected value
        // Check that option 2 is Attachments with the expected value
       */
    });
});
