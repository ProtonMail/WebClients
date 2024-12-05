import { render } from '@testing-library/react';

import PasswordStrengthIndicator from './PasswordStrengthIndicator';

describe('<PasswordStrengthIndicator />', () => {
    it('should render with the provided className', () => {
        const { container } = render(<PasswordStrengthIndicator score="Vulnerable" />);

        expect(container.firstChild).toHaveClass('password-strength-indicator');
        expect(container.firstChild).toHaveClass('password-strength-indicator--vulnerable');
    });
});
