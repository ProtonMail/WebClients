import { render } from '@testing-library/react';

import NotificationDot from './NotificationDot';

describe('<NotificationDot />', () => {
    it('renders the passed color', () => {
        const { container } = render(
          <NotificationDot color="danger" />
        );

        expect(container.firstChild).toHaveClass('bg-danger');
    });
});
