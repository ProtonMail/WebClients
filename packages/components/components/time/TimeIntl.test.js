import { render } from '@testing-library/react';

import { readableTimeIntl } from '@proton/shared/lib/helpers/time';

import TimeIntl from './TimeIntl';

describe('TimeIntl component', () => {
    const unixDate = 1552897937;

    it('should handle default when time is not set', () => {
        const { container } = render(<TimeIntl />);

        expect(container.firstChild.textContent).toBe('Jan 1, 1970');
    });

    it('should display time', () => {
        const { container } = render(<TimeIntl>{unixDate}</TimeIntl>);

        expect(container.firstChild.textContent).toBe(readableTimeIntl(unixDate));
    });

    it('should support Intl options', () => {
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };
        const { container } = render(<TimeIntl options={options}>{unixDate}</TimeIntl>);

        expect(container.firstChild.textContent).toBe(
            readableTimeIntl(unixDate, {
                intlOptions: options,
            })
        );
    });

    it('should support Intl options forcing', () => {
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const sameDayOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const { container } = render(
            <TimeIntl options={options} sameDayOptions={sameDayOptions}>
                {todayUnixDate}
            </TimeIntl>
        );

        expect(container.firstChild.textContent).toBe(
            readableTimeIntl(todayUnixDate, {
                intlOptions: options,
                sameDayIntlOptions: sameDayOptions,
            })
        );
    });

    it('should support Intl options forcing (sameDayOptions={false})', () => {
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };

        const { container } = render(
            <TimeIntl options={options} sameDayOptions={false}>
                {todayUnixDate}
            </TimeIntl>
        );

        expect(container.firstChild.textContent).toBe(
            readableTimeIntl(todayUnixDate, {
                intlOptions: options,
                sameDayIntlOptions: options,
            })
        );
    });
});
