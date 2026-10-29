import { fireEvent, render, screen } from '@testing-library/react';

import { UserIdentity } from './UserIdentity';

describe('UserIdentity', () => {
    it('renders the name, the email and the initials', () => {
        render(<UserIdentity name="Alice Anderson" email="alice@proton.me" />);

        expect(screen.getByText('Alice Anderson')).toBeInTheDocument();
        expect(screen.getByText('alice@proton.me')).toBeInTheDocument();
        expect(screen.getByText('AA')).toBeInTheDocument();
    });

    it('hides the email when it is the same as the name, ignoring case', () => {
        render(<UserIdentity name="alice@proton.me" email="Alice@proton.me" />);

        expect(screen.getByText('alice@proton.me')).toBeInTheDocument();
        expect(screen.queryByText('Alice@proton.me')).not.toBeInTheDocument();
    });

    it('falls back to the email for the text and the initials when there is no name', () => {
        render(<UserIdentity email="alice@proton.me" />);

        expect(screen.getByText('alice@proton.me')).toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders nothing when there is neither a name nor an email', () => {
        const { container } = render(<UserIdentity />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders a button that calls onClick when a handler is passed', () => {
        const onClick = jest.fn();
        render(<UserIdentity name="Alice Anderson" email="alice@proton.me" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render a button without onClick', () => {
        render(<UserIdentity name="Alice Anderson" email="alice@proton.me" />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('passes the test id through', () => {
        render(<UserIdentity name="Alice Anderson" data-testid="auth-logs:user" />);

        expect(screen.getByTestId('auth-logs:user')).toBeInTheDocument();
    });
});
