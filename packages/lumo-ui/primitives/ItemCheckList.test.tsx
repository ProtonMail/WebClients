import { render, screen } from '@testing-library/react';

import ItemCheckList from './ItemCheckList';

const item = { id: 'a', label: 'Acme Travel', subtitle: 'Booking confirmation', meta: '11 Aug' };

const renderList = (items: Parameters<typeof ItemCheckList>[0]['items'], selectedIds = ['a']) =>
    render(<ItemCheckList items={items} selectedIds={selectedIds} onToggle={jest.fn()} />);

describe('ItemCheckList', () => {
    it('renders the subtitle and meta beside the label', () => {
        renderList([item]);

        expect(screen.getByText('Acme Travel')).toBeInTheDocument();
        expect(screen.getByText('Booking confirmation')).toBeInTheDocument();
        expect(screen.getByText('11 Aug')).toBeInTheDocument();
    });

    it('renders the label alone when there is no subtitle or meta', () => {
        renderList([{ id: 'a', label: 'Acme Travel' }]);

        expect(screen.getByText('Acme Travel')).toBeInTheDocument();
        expect(screen.getByRole('checkbox').closest('label')).toHaveTextContent(/^Acme Travel$/);
    });

    it('keeps both clipped lines recoverable through a title', () => {
        renderList([item]);

        expect(screen.getByText('Acme Travel')).toHaveAttribute('title', 'Acme Travel');
        expect(screen.getByText('Booking confirmation')).toHaveAttribute('title', 'Booking confirmation');
    });

    it('dims a deselected row as well as clearing its tick', () => {
        const { container } = renderList([item], []);

        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(container.querySelector('.lumo-check-list__item--deselected')).toBeInTheDocument();
    });
});
