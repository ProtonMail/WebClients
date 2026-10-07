import { useLocation } from 'react-router-dom';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { addApiMock, addApiResolver, apiMock, clearApiMocks } from '@proton/test-api/api';

import type { SignInLocationState } from '../sign-in/SignInContainer';
import { ResetPasswordPage } from './ResetPasswordPage';
import { authMnemonicAndGetKeys, handleRequestRecoveryMethods, performPasswordReset } from './actions';
import { NoKeysDecryptedUsingPhraseError, ResetTokenRejectedError } from './state-machine/forgotPasswordErrors';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    handleRequestRecoveryMethods: jest.fn(),
    authMnemonicAndGetKeys: jest.fn(),
    performPasswordReset: jest.fn(),
    performPasswordChangeViaMnemonic: jest.fn(),
    getDeviceRecoveryLevel: jest.fn(),
}));

jest.mock('../reset/resetPasswordTelemetry', () => ({
    useResetPasswordTelemetry: () => ({
        sendResetPasswordPageLoad: jest.fn(),
        sendResetPasswordPageExit: jest.fn(),
        sendResetPasswordStepLoad: jest.fn(),
        sendResetPasswordCodeSent: jest.fn(),
        sendResetPasswordRecoveryMethodsRequested: jest.fn(),
        sendResetPasswordMethodValidated: jest.fn(),
        sendResetPasswordSuccess: jest.fn(),
        sendResetPasswordFailure: jest.fn(),
    }),
}));

jest.mock('../locales', () => jest.requireActual('../locales'));

// The phrase's checksum isn't what these tests are about
jest.mock('@proton/shared/lib/mnemonic', () => ({
    ...jest.requireActual('@proton/shared/lib/mnemonic'),
    validateMnemonic: () => Promise.resolve(true),
}));

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

function ForgotPasswordHarness() {
    return (
        <ResetPasswordPage
            onLogin={jest.fn()}
            onPreSubmit={() => Promise.resolve()}
            onStartAuth={() => Promise.resolve()}
            productParam="generic"
            setupVPN={false}
            toApp={undefined}
            loginUrl="/login"
            metaTags={{
                description: '',
                title: '',
                ogImage: '',
            }}
        />
    );
}

/** Where the page went, and the username it handed to the sign-in form. */
function LocationProbe() {
    const location = useLocation<SignInLocationState | undefined>();
    return <div data-testid="location">{`${location.pathname} ${location.state?.username ?? ''}`}</div>;
}

describe('UnauthedForgotPasswordWizard', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        // The answers a test queues on these don't reach the next, even when it fails before using them
        jest.mocked(handleRequestRecoveryMethods).mockReset();
        jest.mocked(authMnemonicAndGetKeys).mockReset();
        jest.mocked(performPasswordReset).mockReset();
        mockCreateNotification.mockClear();
    });

    async function startRecovery(methods: ('email' | 'sms' | 'mnemonic')[]) {
        jest.mocked(handleRequestRecoveryMethods).mockResolvedValueOnce({
            methods,
            accountType: 'internal' as const,
            username: 'user@example.com',
            redactedEmail: methods.includes('email') ? 'u***@example.com' : '',
            redactedPhoneNumber: methods.includes('sms') ? '+1***5678' : '',
            hasEmergencyContacts: false,
        });
        await user.type(screen.getByRole('textbox'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: 'Next' }));
    }

    /** The email step sends its code as it opens: Back and "Try another way" wait for it, as Verify does. */
    async function waitForEmailCode() {
        await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled());
    }

    it('renders "Recover account" heading with "Return to sign-in" button on load', async () => {
        renderWithProviders(<ForgotPasswordHarness />);

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Return to sign-in' })).toBeInTheDocument();
    });

    describe('email recovery', () => {
        it('shows "Verify it\'s you" heading with "Try another way" and "Back" buttons', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email']);

            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            expect(screen.getByRole('button', { name: 'Try another way' })).toBeInTheDocument();
            expect(within(screen.getByRole('main')).getByRole('button', { name: 'Back' })).toBeInTheDocument();
        });

        it('"Back" from verifyRecoveryEmail returns to "Recover account" heading, with the username filled in', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            await waitForEmailCode();

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
            expect(screen.getByRole('textbox')).toHaveValue('user@example.com');
        });

        it('"Return to sign-in" starts the sign-in form with the username the user gave', async () => {
            renderWithProviders(
                <>
                    <ForgotPasswordHarness />
                    <LocationProbe />
                </>
            );
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            await user.click(screen.getByRole('button', { name: 'Return to sign-in' }));

            expect(screen.getByTestId('location')).toHaveTextContent('/login user@example.com');
        });

        it('"Back" from the first step starts the sign-in form with the last username the user gave', async () => {
            renderWithProviders(
                <>
                    <ForgotPasswordHarness />
                    <LocationProbe />
                </>
            );
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            await waitForEmailCode();
            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            // The machine leaves for the sign-in page, with its username
            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            expect(screen.getByTestId('location')).toHaveTextContent('/login user@example.com');
        });

        it('"Try another way" from verifyRecoveryEmail advances to SMS step showing "Send code"', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email', 'sms']);
            await waitForEmailCode();

            await user.click(screen.getByRole('button', { name: 'Try another way' }));

            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());
        });

        describe('the code', () => {
            afterEach(() => clearApiMocks());

            it('can be typed while it’s sent, with Verify waiting for it without looking disabled', async () => {
                const sending = addApiResolver('core/v4/reset', 'post');
                const checking = addApiResolver('core/v4/reset/user@example.com/123456', 'get');
                renderWithProviders(<ForgotPasswordHarness />);
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument()
                );

                await startRecovery(['email']);
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument()
                );

                // The code is on its way: it can be typed, and Verify waits for it, without loading
                await user.type(screen.getByRole('textbox'), '123456');
                const verify = screen.getByRole('button', { name: 'Verify' });
                expect(verify).toBeDisabled();
                expect(verify).toHaveClass('no-disabled-styles');
                expect(verify).toHaveAttribute('aria-busy', 'false');
                // "Try another way" waits for the code too, as the machine does, without the disabled look
                const tryAnotherWay = screen.getByRole('button', { name: 'Try another way' });
                expect(tryAnotherWay).toBeDisabled();
                expect(tryAnotherWay).toHaveClass('no-disabled-styles');

                sending.resolve({});
                await waitFor(() => expect(verify).toBeEnabled());
                expect(verify).not.toHaveClass('no-disabled-styles');
                expect(tryAnotherWay).toBeEnabled();
                expect(tryAnotherWay).not.toHaveClass('no-disabled-styles');
                await user.click(verify);
                // Only now is there a code to check: Verify loads until it's checked, and "Try another way" waits
                expect(screen.getByRole('button', { name: /Verify/ })).toHaveAttribute('aria-busy', 'true');
                expect(tryAnotherWay).toBeDisabled();
                expect(tryAnotherWay).toHaveClass('no-disabled-styles');

                checking.resolve({ Sessions: [], DelegatedAccesses: [] });
                // Verified, with no phrase, signed-in sessions or contacts: the data-loss offer is next
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument()
                );
            });

            it('is checked without the spaces pasted around it, which the reset wouldn’t take', async () => {
                addApiMock('core/v4/reset/user@example.com/654321', () => ({ Sessions: [], DelegatedAccesses: [] }));
                renderWithProviders(<ForgotPasswordHarness />);
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument()
                );

                await startRecovery(['email']);
                await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled());
                await user.click(screen.getByRole('textbox'));
                await user.paste(' 654321 ');
                await user.click(screen.getByRole('button', { name: 'Verify' }));

                await waitFor(() =>
                    expect(apiMock).toHaveBeenCalledWith(
                        expect.objectContaining({ url: 'core/v4/reset/user@example.com/654321' })
                    )
                );
                // Verified, with no phrase, signed-in sessions or contacts: the data-loss offer is next
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument()
                );
            });

            it('is checked before trying another way, which waits for it', async () => {
                const checking = addApiResolver('core/v4/reset/user@example.com/123456', 'get');
                renderWithProviders(<ForgotPasswordHarness />);
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument()
                );

                await startRecovery(['email', 'sms']);
                await waitForEmailCode();
                await user.type(screen.getByRole('textbox'), '123456');
                await user.click(screen.getByRole('button', { name: 'Verify' }));

                // The SMS code another way would send could be deleted by the check, if it fails late
                expect(screen.getByRole('button', { name: 'Try another way' })).toBeDisabled();
                await user.click(screen.getByRole('button', { name: 'Try another way' }));
                expect(screen.queryByRole('button', { name: 'Send code' })).not.toBeInTheDocument();

                checking.resolve({ Sessions: [], DelegatedAccesses: [] });
                // Verified, with no phrase, signed-in sessions or contacts: the data-loss offer is next
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument()
                );
            });
        });
    });

    describe('SMS recovery', () => {
        afterEach(() => clearApiMocks());

        it('enterRecoverySms shows "Verify it\'s you" heading with "Send code" and "Try another way" buttons', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);

            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());
            expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Try another way' })).toBeInTheDocument();
        });

        it('keeps "Try another way" waiting, without the disabled look, while the code is sent', async () => {
            const sending = addApiResolver('core/v4/reset', 'post');
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);
            await user.click(await screen.findByRole('button', { name: 'Send code' }));

            const tryAnotherWay = screen.getByRole('button', { name: 'Try another way' });
            await waitFor(() => expect(tryAnotherWay).toBeDisabled());
            expect(tryAnotherWay).toHaveClass('no-disabled-styles');

            sending.resolve({});
            await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument());
        });

        it('"Back" from enterRecoverySms returns to "Recover account" heading', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
        });

        it('verifyRecoverySms shows "Verify" and "Try another way" buttons', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Send code' }));

            await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument());
            expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Try another way' })).toBeInTheDocument();
        });

        it('"Back" from verifyRecoverySms returns to "Send code" (enterRecoverySms), not entry', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Send code' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument());

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());
            expect(screen.queryByRole('heading', { name: 'Recover account' })).not.toBeInTheDocument();
        });
    });

    describe('mnemonic recovery', () => {
        it('skip email + skip SMS → "Verify it\'s you" heading with "I don\'t have my phrase" button', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email', 'sms', 'mnemonic']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            await waitForEmailCode();

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));

            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );
            expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument();
        });

        it('"Back" from enterPhrase goes back up the skipped methods, then to "Recover account"', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email', 'sms', 'mnemonic']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());
            await waitForEmailCode();

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));
            await waitForEmailCode();

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
        });

        it('starts over, saying why, when the phrase signs in but decrypts no keys', async () => {
            jest.mocked(authMnemonicAndGetKeys).mockRejectedValueOnce(new NoKeysDecryptedUsingPhraseError());
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['mnemonic']);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );
            await user.click(screen.getByRole('textbox'));
            await user.paste(Array(12).fill('word').join(' '));
            await user.click(screen.getByRole('button', { name: 'Reset password' }));

            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
            expect(screen.getByRole('textbox')).toHaveValue('user@example.com');
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'The recovery phrase signed in, but decrypted none of the keys',
            });
        });
    });

    describe('the back buttons', () => {
        // The page's shows on small screens, the step heading's on larger ones
        const pageBackButton = () => within(screen.getByRole('banner')).queryByRole('button', { name: 'Back' });
        const stepBackButton = () => within(screen.getByRole('main')).queryByRole('button', { name: 'Back' });

        it('show only where the step has somewhere to go back to', async () => {
            jest.mocked(authMnemonicAndGetKeys).mockResolvedValueOnce({
                authResponse: {} as AuthResponse,
                decryptedUserKeys: [],
            });
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
            // Back from the entry step leaves for the sign-in page
            expect(pageBackButton()).toBeInTheDocument();
            expect(stepBackButton()).toBeInTheDocument();

            await startRecovery(['mnemonic']);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );
            expect(pageBackButton()).toBeInTheDocument();
            expect(stepBackButton()).toBeInTheDocument();

            await user.click(screen.getByRole('textbox'));
            await user.paste(Array(12).fill('word').join(' '));
            await user.click(screen.getByRole('button', { name: 'Reset password' }));

            // Confirming the phrase has no way back
            await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument());
            expect(pageBackButton()).not.toBeInTheDocument();
            expect(stepBackButton()).not.toBeInTheDocument();
        });

        it('stay while the phrase is checked, and wait for it', async () => {
            let settle: (keys: Awaited<ReturnType<typeof authMnemonicAndGetKeys>>) => void = () => {};
            jest.mocked(authMnemonicAndGetKeys).mockReturnValueOnce(new Promise((resolve) => (settle = resolve)));
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['mnemonic']);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );
            await user.click(screen.getByRole('textbox'));
            await user.paste(Array(12).fill('word').join(' '));
            await user.click(screen.getByRole('button', { name: 'Reset password' }));

            // Back waits for the check, which could undo where it leads: as in the sign-in, it stays, doing nothing
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /Reset password/ })).toHaveAttribute('aria-busy', 'true')
            );
            expect(pageBackButton()).toBeEnabled();
            await user.click(stepBackButton()!);
            expect(screen.queryByRole('heading', { name: 'Recover account' })).not.toBeInTheDocument();
            // Skipping the phrase waits too, without the disabled look
            const skipPhrase = screen.getByRole('button', { name: /I don.t have my phrase/ });
            expect(skipPhrase).toBeDisabled();
            expect(skipPhrase).toHaveClass('no-disabled-styles');

            // So the check still leads on
            settle({ authResponse: {} as AuthResponse, decryptedUserKeys: [] });
            await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument());
        });

        describe('on the data-loss offer', () => {
            afterEach(() => clearApiMocks());

            it('show, and the page’s keeps the focus when back from “Couldn’t recover your account” lands there', async () => {
                addApiMock('core/v4/reset/user@example.com/123456', () => ({ Sessions: [], DelegatedAccesses: [] }));
                renderWithProviders(<ForgotPasswordHarness />);
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument()
                );

                await startRecovery(['email']);
                await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled());
                await user.type(screen.getByRole('textbox'), '123456');
                await user.click(screen.getByRole('button', { name: 'Verify' }));

                // Verified, with no phrase, signed-in sessions or contacts: the data-loss offer is next
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument()
                );
                expect(pageBackButton()).toBeInTheDocument();
                expect(stepBackButton()).toBeInTheDocument();

                await user.click(screen.getByRole('button', { name: 'Try another way' }));
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: /Couldn.t recover your account/ })).toBeInTheDocument()
                );

                await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Back' }));
                await waitFor(() =>
                    expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument()
                );
                expect(pageBackButton()).toHaveFocus();
            });
        });
    });

    describe('the new password', () => {
        afterEach(() => clearApiMocks());

        it('starts over, with the username filled in, when the reset refuses the code', async () => {
            addApiMock('core/v4/reset/user@example.com/123456', () => ({ Sessions: [], DelegatedAccesses: [] }));
            jest.mocked(performPasswordReset).mockRejectedValueOnce(new ResetTokenRejectedError(new Error('expired')));
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            // Verified, with no phrase, signed-in sessions or contacts: the data-loss offer, then the new password
            await startRecovery(['email']);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled());
            await user.type(screen.getByRole('textbox'), '123456');
            await user.click(screen.getByRole('button', { name: 'Verify' }));
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Reset password?' })).toBeInTheDocument());
            await user.click(screen.getByRole('button', { name: 'Continue' }));
            await waitFor(() => expect(screen.getByLabelText('New password')).toBeInTheDocument());

            await user.type(screen.getByLabelText('New password'), 'a new password');
            await user.type(screen.getByLabelText('Confirm password'), 'a new password');
            await user.click(screen.getByRole('button', { name: 'Continue' }));

            // The form can't work without a valid code, so the first step shows again, ready to send for a new one
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
            expect(screen.getByRole('textbox')).toHaveValue('user@example.com');
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'This code or link is no longer valid. Please try again.',
            });
        });
    });
});
