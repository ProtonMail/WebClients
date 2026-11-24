import { fireEvent, render, screen } from '@testing-library/react';

import { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';

import ViewLayoutCards from './ViewLayoutCards';

describe('<ViewLayoutCards />', () => {
    it('should render both cards with the current layout selected', () => {
        render(
            <ViewLayoutCards viewLayout={VIEW_LAYOUT.ROW} onChange={vi.fn()} loading={false} describedByID="desc" />
        );

        expect(screen.getByTestId('layout:Column')).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByTestId('layout:Row')).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onChange with the clicked layout', () => {
        const onChange = vi.fn();
        render(
            <ViewLayoutCards viewLayout={VIEW_LAYOUT.ROW} onChange={onChange} loading={false} describedByID="desc" />
        );

        fireEvent.click(screen.getByTestId('layout:Column'));

        expect(onChange).toHaveBeenCalledWith(VIEW_LAYOUT.COLUMN);
    });

    it('should disable both cards while loading', () => {
        render(<ViewLayoutCards viewLayout={VIEW_LAYOUT.ROW} onChange={vi.fn()} loading={true} describedByID="desc" />);

        expect(screen.getByTestId('layout:Column')).toBeDisabled();
        expect(screen.getByTestId('layout:Row')).toBeDisabled();
    });
});
