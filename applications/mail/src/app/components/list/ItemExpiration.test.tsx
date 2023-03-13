import { render, screen } from '@testing-library/react';
import { addDays, addHours, addMinutes, getUnixTime } from 'date-fns';

import ItemExpiration from './ItemExpiration';

describe('ItemExpiration', () => {
    it('should not render if expirationTime is not provided', () => {
        render(<ItemExpiration />);
        expect(screen.queryByTestId('item-expiration')).not.toBeInTheDocument();
    });

    it('should have color-danger class if it is expiring in less than a day', () => {
        const date = addHours(new Date(), 1);
        const expirationTime = getUnixTime(date);
        render(<ItemExpiration expirationTime={expirationTime} />);
        expect(screen.getByTestId('item-expiration')).toHaveClass('color-danger');
    });

    it('should not have color-danger class if it is expiring in more than a day', () => {
        const date = addHours(new Date(), 24);
        const expirationTime = getUnixTime(date);
        render(<ItemExpiration expirationTime={expirationTime} />);
        expect(screen.getByTestId('item-expiration')).not.toHaveClass('color-danger');
    });

    it('should show a short remaining time', () => {
        const date = addMinutes(new Date(), 10);
        const expirationTime = getUnixTime(date);
        render(<ItemExpiration expirationTime={expirationTime} />);
        expect(screen.getByText('<1 hour')).toBeInTheDocument();
    });

    it('should diplay 30 days', () => {
        const date = addDays(new Date(), 30);
        const expirationTime = getUnixTime(date);
        render(<ItemExpiration expirationTime={expirationTime} />);
        expect(screen.getByText('30 days')).toBeInTheDocument();
    });
});
