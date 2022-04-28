import { render } from '@testing-library/react';
import { ThemeColor } from '@proton/colors';

import NotificationDot from './NotificationDot';

describe('<NotificationDot />', () => {
    it('renders the passed color', () => {
        const { container } = render(<NotificationDot color={ThemeColor.Danger} />);

        expect(container.firstChild).toHaveClass('bg-danger');
    });
});
