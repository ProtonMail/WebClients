import { render } from '@testing-library/react';

import { readableTimeLegacy } from '@proton/shared/lib/helpers/time';

import Time from './Time';

describe('Time component', () => {
    const unixDate = 1552897937;

    it('should handle default when time is not set', () => {
        const { container } = render(<Time />);

        expect(container.firstChild.textContent).toBe('Jan 1, 1970');
    });

    it('should display time', () => {
        const { container } = render(<Time>{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe(readableTimeLegacy(unixDate));
    });

    it('should support format', () => {
        const { container } = render(<Time format="PPp">{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe(readableTimeLegacy(unixDate, 'PPp'));
    });

    it('should support format forcing', () => {
        const todayUnixDate = Math.floor(Date.now() / 1000);

        const { container } = render(
            <Time format="PP" forceFormat={true}>
                {todayUnixDate}
            </Time>
        );

        expect(container.firstChild.textContent).toBe(readableTimeLegacy(todayUnixDate, 'PP', {}, true));
    });
});
