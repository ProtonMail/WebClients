import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CopyPublicLink } from './CopyPublicLink';

describe('CopyPublicLink', () => {
    const defaultProps = {
        url: 'https://example.com/public-link',
        onClick: jest.fn(),
        disabled: false,
        isExpired: false,
    };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the copy link button when not expired', () => {
        render(<CopyPublicLink {...defaultProps} />);
        expect(screen.getByTestId('share-anyone-copyUrlButton')).toBeInTheDocument();
        expect(screen.queryByTestId('share-anyone-expired-copyUrlButton')).not.toBeInTheDocument();
    });

    it('calls onClick when the copy link button is clicked', async () => {
        const onClick = jest.fn();
        render(<CopyPublicLink {...defaultProps} onClick={onClick} />);

        await user.click(screen.getByTestId('share-anyone-copyUrlButton'));

        expect(onClick).toHaveBeenCalled();
    });

    it('shows "Link copied" after clicking the copy link button', async () => {
        render(<CopyPublicLink {...defaultProps} />);

        await user.click(screen.getByTestId('share-anyone-copyUrlButton'));

        expect(screen.getByText('Link copied')).toBeInTheDocument();
    });

    it('disables the copy link button when disabled prop is true', () => {
        render(<CopyPublicLink {...defaultProps} disabled={true} />);
        expect(screen.getByTestId('share-anyone-copyUrlButton')).toBeDisabled();
    });

    it('shows the expired button and disables the url input when isExpired is true', () => {
        render(<CopyPublicLink {...defaultProps} isExpired={true} />);

        expect(screen.queryByTestId('share-anyone-copyUrlButton')).not.toBeInTheDocument();
        expect(screen.getByTestId('share-anyone-expired-copyUrlButton')).toBeInTheDocument();
        expect(screen.getByTestId('share-anyone-expired-copyUrlButton')).toBeDisabled();
        expect(screen.getByTestId('share-anyone-url')).toBeDisabled();
    });

    it('disables the url input when there is no url', () => {
        render(<CopyPublicLink {...defaultProps} url={undefined} />);
        expect(screen.getByTestId('share-anyone-url')).toBeDisabled();
    });
});
