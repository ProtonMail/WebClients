import { render, screen } from '@testing-library/react';

import { IcUser } from '@proton/icons/icons/IcUser';

import { IconSlot } from './IconSlot';

describe('IconSlot', () => {
    it('should render an Ic* icon component with the slot props', () => {
        render(<IconSlot icon={IcUser} data-testid="icon" />);
        expect(screen.getByTestId('icon').tagName).toBe('svg');
    });

    it('should render a pre-rendered element as is', () => {
        render(<IconSlot icon={<span data-testid="element" />} data-testid="ignored" />);
        expect(screen.getByTestId('element')).toBeInTheDocument();
        expect(screen.queryByTestId('ignored')).toBeNull();
    });
});
