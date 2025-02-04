import { render } from '@testing-library/react';

import BasePasswordStrengthIndicator from './BasePasswordStrengthIndicator';

describe('<PasswordStrengthIndicator />', () => {
    it('should render with the provided className', () => {
        const { container } = render(
            <BasePasswordStrengthIndicator score="Vulnerable" variant="compact" password="1234" />
        );

        expect(container.firstChild).toHaveClass('password-strength-indicator');
    });
});
