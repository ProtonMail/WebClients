import { render } from '@testing-library/react';

import LayoutFooter from './LayoutFooter';

describe('<LayoutFooter />', () => {
    // NOTE: Don't remove this test. Often forget the old-link class, let's make sure it's always there.
    it('adds the old-link class', () => {
        const { getByText } = render(<LayoutFooter version="123" app="proton-mail" />);

        const element = getByText('Privacy policy');

        expect(element).toHaveClass('old-link');
    });
});
