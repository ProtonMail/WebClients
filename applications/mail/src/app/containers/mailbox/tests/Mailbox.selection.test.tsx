import { fireEvent, screen } from '@testing-library/react';

import { clearAll } from '../../../helpers/test/helper';
import { props, setup } from './Mailbox.test.helpers';

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => {
        return { stopELDTMetric: jest.fn() };
    },
}));

describe('Mailbox elements selection', () => {
    const conversations = [
        { ID: '1', Labels: [{ ID: props.labelID }] },
        { ID: '2', Labels: [{ ID: props.labelID }] },
    ];

    beforeEach(clearAll);

    it('should show list when elements finish loading', async () => {
        const { getItems } = await setup({ conversations });

        const items = getItems();

        expect(items.length === conversations.length).toBe(true);
    });

    it('should select all', async () => {
        await setup({ conversations });

        const checkAll = screen.getByTestId('toolbar:select-all-checkbox');
        fireEvent.click(checkAll);

        const allChecks = screen.getAllByTestId('item-checkbox') as HTMLInputElement[];
        expect(allChecks.length > 0).toBe(true);

        const checked = [...allChecks].every((oneCheck) => oneCheck.checked);
        expect(checked).toBe(true);
    });
});
