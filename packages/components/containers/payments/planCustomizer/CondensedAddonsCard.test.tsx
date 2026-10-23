import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CondensedAddonRow, CondensedAddonsCard } from './CondensedAddonsCard';

const onAddMock = jest.fn();

const description = 'Lumo is a privacy-first AI';

const renderRow = () =>
    render(
        <CondensedAddonRow
            name="Lumo"
            price={<span>€1 per month</span>}
            description={description}
            onAdd={onAddMock}
            testId="lumo-addon-row"
        />
    );

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CondensedAddonRow', () => {
    it('should show the name and the price', () => {
        renderRow();

        expect(screen.getByText('Lumo')).toBeInTheDocument();
        expect(screen.getByText('€1 per month')).toBeInTheDocument();
    });

    it('should toggle the description with the info button', () => {
        renderRow();
        const infoButton = screen.getByRole('button', { name: 'About Lumo' });

        expect(screen.queryByText(description)).not.toBeInTheDocument();
        expect(infoButton).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(infoButton);
        expect(screen.getByText(description)).toBeInTheDocument();
        expect(infoButton).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(infoButton);
        expect(screen.queryByText(description)).not.toBeInTheDocument();
        expect(infoButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should point the info button at the description', () => {
        renderRow();
        const infoButton = screen.getByRole('button', { name: 'About Lumo' });

        fireEvent.click(infoButton);
        expect(screen.getByText(description)).toHaveAttribute('id', infoButton.getAttribute('aria-controls'));
    });

    it('should call onAdd from the Add button', () => {
        renderRow();

        fireEvent.click(screen.getByRole('button', { name: 'Add Lumo' }));
        expect(onAddMock).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('lumo-addon-row-add-button')).toBeInTheDocument();
    });

    it('should reach the info then the Add button with Tab and toggle the description from the keyboard', async () => {
        renderRow();
        const infoButton = screen.getByRole('button', { name: 'About Lumo' });
        const addButton = screen.getByRole('button', { name: 'Add Lumo' });

        await userEvent.tab();
        expect(infoButton).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        expect(infoButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText(description)).toBeInTheDocument();

        await userEvent.keyboard(' ');
        expect(infoButton).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText(description)).not.toBeInTheDocument();

        await userEvent.tab();
        expect(addButton).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        expect(onAddMock).toHaveBeenCalledTimes(1);
    });
});

describe('CondensedAddonsCard', () => {
    it('should wrap each child in its own row', () => {
        render(
            <CondensedAddonsCard>
                <span>first</span>
                <span>second</span>
            </CondensedAddonsCard>
        );

        const card = screen.getByTestId('condensed-addons-card');
        expect(card.querySelectorAll('.condensed-addons-card-row')).toHaveLength(2);
    });
});
