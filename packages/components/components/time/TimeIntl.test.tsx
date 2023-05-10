import { render } from '@testing-library/react';
import { fromUnixTime } from 'date-fns';

import { readableTimeIntl } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

import TimeIntl from './TimeIntl';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: {
        code: 'en-US',
        formatLong: {
            time: jest.fn(),
        },
    },
}));
const mockedFormatLongTime = jest.mocked(dateLocale.formatLong!.time).mockReturnValue('h:mm:ss a zzzz');

describe('TimeIntl component', () => {
    const unixDate = 1552897937;

    it('should handle default when time is not set', () => {
        const { container } = render(<TimeIntl />);

        expect(container.firstChild?.textContent).toBe('Jan 1, 1970');
    });

    it('should display time if same day', () => {
        jest.useFakeTimers().setSystemTime(fromUnixTime(unixDate));
        const { container } = render(<TimeIntl>{unixDate}</TimeIntl>);

        expect(container.firstChild?.textContent).toBe(
            readableTimeIntl(unixDate, {
                intlOptions: {
                    hour12: true,
                    hour: 'numeric',
                    minute: 'numeric',
                },
            })
        );
        jest.useRealTimers();
    });

    it('should display time with AM/PM if b is present in date-fns time format', () => {
        jest.useFakeTimers().setSystemTime(fromUnixTime(unixDate));

        mockedFormatLongTime.mockReturnValueOnce('h:mm:ss b zzzz');
        const { container } = render(<TimeIntl>{unixDate}</TimeIntl>);

        expect(container.firstChild?.textContent).toBe(
            readableTimeIntl(unixDate, {
                intlOptions: {
                    hour12: true,
                    hour: 'numeric',
                    minute: 'numeric',
                },
            })
        );
        jest.useRealTimers();
    });

    it('should support Intl options', () => {
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };
        const { container } = render(<TimeIntl options={options}>{unixDate}</TimeIntl>);

        expect(container.firstChild?.textContent).toBe(
            readableTimeIntl(unixDate, {
                intlOptions: options,
            })
        );
    });

    it('should support Intl options forcing', () => {
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const sameDayOptions: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const { container } = render(
            <TimeIntl options={options} sameDayOptions={sameDayOptions}>
                {todayUnixDate}
            </TimeIntl>
        );

        expect(container.firstChild?.textContent).toBe(
            readableTimeIntl(todayUnixDate, {
                intlOptions: options,
                sameDayIntlOptions: sameDayOptions,
            })
        );
    });

    it('should support Intl options forcing (sameDayOptions={false})', () => {
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const { container } = render(
            <TimeIntl options={options} sameDayOptions={false}>
                {todayUnixDate}
            </TimeIntl>
        );

        expect(container.firstChild?.textContent).toBe(
            readableTimeIntl(todayUnixDate, {
                intlOptions: options,
                sameDayIntlOptions: options,
            })
        );
    });

    it('should support 24hour date format', () => {
        mockedFormatLongTime.mockReturnValue('h:mm:ss zzzz');
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const { container } = render(<TimeIntl>{todayUnixDate}</TimeIntl>);

        expect(container.firstChild?.textContent).toBe(readableTimeIntl(todayUnixDate, { hour12: false }));
    });
});
