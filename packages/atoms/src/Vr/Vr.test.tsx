import { render } from '@testing-library/react';

import { Vr } from './Vr';

describe('<Vr />', () => {
    it('should render with className vr', () => {
        const { container } = render(<Vr className="should-be-passed" />);

        expect(container.firstChild).toHaveClass('vr');
        expect(container.firstChild).toHaveClass('should-be-passed');
    });
});
