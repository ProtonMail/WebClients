import { render, screen } from '@testing-library/react';

import RegisterSecurityKeyContent from './RegisterSecurityKeyContent';

describe('RegisterSecurityKeyContent', () => {
    it.each([
        ['InvalidStateError', 'This security key is already registered to your account.'],
        ['NotSupportedError', "This browser doesn't support security keys. Please try a different browser."],
        [
            'NotReadableError',
            "Your device couldn't complete the security key request. Try again, or register the key from another device.",
        ],
        ['NotAllowedError', 'The security key request was cancelled or timed out. Please try again.'],
        ['UnknownError', 'Something went wrong registering your security key. Please try again.'],
    ])('explains a %s', (error, message) => {
        render(<RegisterSecurityKeyContent awaitingTouch={false} error={error} checkbox={null} />);

        expect(screen.getByText(message)).toBeVisible();
    });
});
