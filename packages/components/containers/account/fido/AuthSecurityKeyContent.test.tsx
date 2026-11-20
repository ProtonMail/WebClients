import { render, screen } from '@testing-library/react';

import AuthSecurityKeyContent from './AuthSecurityKeyContent';

describe('AuthSecurityKeyContent', () => {
    it.each([
        ['NotSupportedError', "This browser doesn't support security keys. Please try a different browser."],
        [
            'NotReadableError',
            "Your device couldn't complete the security key request. Try again, or use another sign-in method.",
        ],
        ['NotAllowedError', 'The security key request was cancelled or timed out. Please try again.'],
        ['UnknownError', 'Something went wrong authenticating with your security key. Please try again.'],
    ])('explains a %s', (error, message) => {
        render(<AuthSecurityKeyContent awaitingTouch={false} error={error} />);

        expect(screen.getByText(message)).toBeVisible();
    });
});
