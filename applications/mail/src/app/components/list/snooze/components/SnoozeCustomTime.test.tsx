import { fireEvent, render } from '@testing-library/react';
import { addDays, format, nextMonday, set } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { useUserSettings } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces';

import { Element } from 'proton-mail/models/element';

import SnoozeCustomTime from './SnoozeCustomTime';

jest.mock('@proton/components/hooks/useUserSettings');
const mockedUserSettings = useUserSettings as jest.MockedFunction<any>;

describe('SnoozeCustomTime', () => {
    const mockedOnClose = jest.fn();
    const mockedHandleSnooze = jest.fn();

    beforeAll(() => {
        mockedUserSettings.mockReturnValue([{ Locale: 'en_US', TimeFormat: SETTINGS_TIME_FORMAT.H12 }]);
    });

    it('should render with default time', async () => {
        const screen = render(<SnoozeCustomTime onClose={mockedOnClose} handleSnooze={mockedHandleSnooze} />);

        expect(screen.getByTestId('snooze-custom-duration-form')).toBeInTheDocument();

        const dateInput = screen.getByTestId('snooze-date-input');
        const timeInput = screen.getByTestId('snooze-time-input');

        expect(dateInput).toHaveValue('Tomorrow');
        expect(timeInput).toHaveValue('9:00 AM');
    });

    it('should render with element default time', async () => {
        const futureDate = set(nextMonday(new Date()), { hours: 10, minutes: 10, seconds: 10 });
        const element = {
            Labels: [{ ID: MAILBOX_LABEL_IDS.SNOOZED, ContextSnoozeTime: futureDate.getTime() / 1000 }],
        } as Element;

        const screen = render(
            <SnoozeCustomTime onClose={mockedOnClose} handleSnooze={mockedHandleSnooze} element={element} />
        );

        expect(screen.getByTestId('snooze-custom-duration-form')).toBeInTheDocument();

        const dateInput = screen.getByTestId('snooze-date-input');
        const timeInput = screen.getByTestId('snooze-time-input');

        const expectedDate = format(futureDate, 'PP');
        expect(dateInput).toHaveValue(expectedDate);
        expect(timeInput).toHaveValue('10:10 AM');
    });

    it('should call the handleSnooze method when clicking on the snooze button', async () => {
        const screen = render(<SnoozeCustomTime onClose={mockedOnClose} handleSnooze={mockedHandleSnooze} />);

        const dateInput = screen.getByTestId('snooze-date-input');
        expect(dateInput).toHaveValue('Tomorrow');

        const timeInput = screen.getByTestId('snooze-time-input');
        fireEvent.change(timeInput, { target: { value: '12:00 PM' } });
        fireEvent.keyDown(timeInput, { key: 'Enter' });

        const snoozeButton = screen.getByTestId('snooze-time-confirm');
        snoozeButton.click();

        const expectedTime = addDays(set(new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }), 1);

        expect(mockedHandleSnooze).toHaveBeenCalledTimes(1);
        expect(mockedHandleSnooze).toHaveBeenCalledWith(expect.any(Object), 'custom', expectedTime);
    });

    it('should disable the snooze button if the date is in the past', async () => {
        const previousDate = format(addDays(new Date(), -5), 'PP', { locale: enUS });
        const screen = render(<SnoozeCustomTime onClose={mockedOnClose} handleSnooze={mockedHandleSnooze} />);

        const dateInput = screen.getByTestId('snooze-date-input');
        fireEvent.change(dateInput, { target: { value: previousDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput).toHaveValue(previousDate);

        const snoozeButton = screen.getByTestId('snooze-time-confirm');
        expect(snoozeButton).toBeDisabled();
    });
});
