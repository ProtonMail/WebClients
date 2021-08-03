import { render } from '@testing-library/react';
import { readableTime } from '@proton/shared/lib/helpers/time';

import Time from './Time';

describe('Time component', () => {
    const unixDate = 1552897937;

    it('should handle default when time is not set', () => {
        const { container } = render(<Time />);

        expect(container.firstChild.textContent).toBe('Jan 1, 1970');
    });

    it('should display time', () => {
        const { container } = render(<Time>{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe(readableTime(unixDate));
    });

    it('should support format', () => {
        const { container } = render(<Time format="PPp">{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe(readableTime(unixDate, 'PPp'));
    });
});
