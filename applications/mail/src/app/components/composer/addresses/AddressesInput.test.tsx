import React from 'react';
import { fireEvent, getByText } from '@testing-library/react';

import { clearAll, render } from '../../../helpers/test/helper';
import AddressesInput from './AddressesInput';

const props: any = {
    id: 'id',
    recipients: [],
    onChange: jest.fn((recipients) => (props.recipients = recipients)),
    inputFocusRef: { current: jest.fn() },
    contacts: [],
    contactGroups: [],
    placeholder: 'placeholder'
};

const email = 'something@test.com';
const other = 'other';

describe('AddressesInput', () => {
    afterEach(() => clearAll());

    it('should split address when using ; key', async () => {
        const { rerender, getByTestId, getAllByTestId } = await render(<AddressesInput {...props} />);
        const input = getByTestId('composer-addresses-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: `${email};${other}` } });
        rerender(<AddressesInput {...props} />);
        const items = getAllByTestId('composer-addresses-item');
        expect(items.length).toBe(1);
        getByText(items[0], email);
        expect(input.value).toBe(other);
    });
});
