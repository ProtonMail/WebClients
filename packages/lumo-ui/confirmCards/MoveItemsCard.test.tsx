import { fireEvent, render, screen } from '@testing-library/react';

import MoveItemsCard from './MoveItemsCard';

const items = [
    { id: 'a', label: 'Invoice #1' },
    { id: 'b', label: 'Invoice #2' },
];

describe('MoveItemsCard', () => {
    it('reflects selection and reports toggles', () => {
        const onToggle = jest.fn();
        render(<MoveItemsCard items={items} selectedIds={['a']} onToggle={onToggle} />);

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();

        fireEvent.click(checkboxes[1]);
        expect(onToggle).toHaveBeenCalledWith('b', true);
    });
});
