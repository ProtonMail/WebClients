import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUseConfig } from '@proton/testing/lib/mockUseConfig';
import { mockUseLocation } from '@proton/testing/lib/mockUseLocation';

import CalendarLimitReachedModal from './CalendarLimitReachedModal';

describe('CalendarLimitReachedModal', () => {
    beforeEach(() => {
        mockUseLocation();
        mockUseConfig();
    });

    describe('when user is free', () => {
        it('should render correct prompt', async () => {
            const onClose = jest.fn();
            render(<CalendarLimitReachedModal open onClose={onClose} isFreeUser />);

            expect(screen.getByRole('heading', { level: 1, name: /Cannot add more calendars/ }));

            expect(screen.getByText("You've reached the maximum number of calendars available in your plan."));
            expect(
                screen.getByText(
                    'To add a new calendar, remove another calendar or upgrade your Proton plan to a Mail paid plan.'
                )
            );

            const link = screen.getByRole('link', { name: /Upgrade/ });
            expect(link).toHaveAttribute('href', '/mail/upgrade?ref=upsell_calendar-modal-max-cal');

            const button = screen.getByRole('button', { name: /Cancel/ });
            await userEvent.click(button);
            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('when user is paid', () => {
        it('should render correct prompt', async () => {
            const onClose = jest.fn();
            render(<CalendarLimitReachedModal open onClose={onClose} isFreeUser={false} />);

            expect(screen.getByRole('heading', { level: 1, name: /Cannot add more calendars/ }));

            expect(screen.getByText("You've reached the maximum number of calendars available in your plan."));
            expect(screen.getByText('To add a new calendar, remove an existing one.'));

            const link = screen.getByRole('link', { name: /Manage/ });
            expect(link).toHaveAttribute('href', '/mail/calendars');

            const button = screen.getByRole('button', { name: /Cancel/ });
            await userEvent.click(button);
            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });
    });
});
