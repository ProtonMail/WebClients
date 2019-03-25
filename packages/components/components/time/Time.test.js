import React from 'react';
import { render } from 'react-testing-library';

import Time from './Time';

describe('Time component', () => {
    const unixDate = 1552897937;

    it('should handle default when time is not set', () => {
        const { container } = render(<Time />);

        expect(container.firstChild.textContent).toBe('January 1, 1970');
    });

    it('should display time', () => {
        const { container } = render(<Time>{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe('March 18, 2019');
    });

    it('should support format', () => {
        const { container } = render(<Time format="LLL">{unixDate}</Time>);

        expect(container.firstChild.textContent).toBe('March 18, 2019 9:32 AM');
    });
});
