import { fireEvent, render, screen } from '@testing-library/react';

import SendWithExpirationModal from './SendWithExpirationModal';

describe('SendWithExpirationModal', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    const setupTest = (emails: string[]) => {
        // @ts-expect-error `open` prop is passed with spread. Force passing it for testing
        return render(<SendWithExpirationModal emails={emails} onSubmit={mockOnSubmit} onClose={mockOnClose} open />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly with single email', () => {
        const emails = ['test@example.com'];
        setupTest(emails);

        expect(screen.getByText('Send without expiration?')).toBeInTheDocument();
        expect(
            screen.getByText(
                "Due to your recipient's configuration, this message can't be sent with an expiration date to the following contact: test@example.com"
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Learn more')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('should render correctly with multiple emails', () => {
        const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com'];
        setupTest(emails);

        expect(
            screen.getByText(
                "Due to your recipient's configuration, this message can't be sent with an expiration date to the following contacts: test1@example.com, test2@example.com, test3@example.com"
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Learn more')).toBeInTheDocument();
    });

    it('should render correctly with more than 10 emails', () => {
        const emails = Array.from({ length: 12 }, (_, i) => `test${i}@example.com`);
        setupTest(emails);

        expect(screen.getByText(/and more./)).toBeInTheDocument();
    });

    it('should call onClose when clicking Cancel button', () => {
        const emails = ['test@example.com'];
        setupTest(emails);

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit and onClose when submitting the form', () => {
        const emails = ['test@example.com'];
        setupTest(emails);

        fireEvent.click(screen.getByText('Send'));
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
