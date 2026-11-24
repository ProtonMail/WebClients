import { render } from '@testing-library/react';

import WarningChainedForwarding from './WarningChainedForwarding';

describe('WarningChainedForwarding', () => {
    const email1 = 'panda@proton.me';
    const email2 = 'tiger@proton.me';

    describe('when email is chained', () => {
        it('should render a warning icon', () => {
            const { getByRole } = render(<WarningChainedForwarding chainedEmails={[email1]} forwardEmail={email1} />);
            expect(getByRole('img', { hidden: true })).toBeInTheDocument();
        });
    });

    describe('when email is not chained', () => {
        it('should not render a warning icon', () => {
            const { queryByRole } = render(<WarningChainedForwarding chainedEmails={[email2]} forwardEmail={email1} />);
            expect(queryByRole('img', { hidden: true })).toBeNull();
        });

        it('even if chained emails is empty', () => {
            const { queryByRole } = render(<WarningChainedForwarding chainedEmails={[]} forwardEmail={email1} />);
            expect(queryByRole('img', { hidden: true })).toBeNull();
        });
    });
});
