import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { addApiMock, clearApiMocks } from '@proton/test-api/api';

import { ResetPasswordPage } from './ResetPasswordPage';
import { authMnemonicAndGetKeys, handleRequestRecoveryMethods } from './actions';

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

describe('UnauthedForgotPasswordWizard', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        jest.mocked(handleRequestRecoveryMethods).mockReset();
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

        it('"Back" from verifyRecoveryEmail returns to "Recover account" heading', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
        });

        it('"Try another way" from verifyRecoveryEmail advances to SMS step showing "Send code"', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email', 'sms']);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));

            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());
        });
    });

    describe('SMS recovery', () => {
        it('enterRecoverySms shows "Verify it\'s you" heading with "Send code" and "Try another way" buttons', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['sms']);

            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());
            expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Try another way' })).toBeInTheDocument();
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

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));

            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );
            expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument();
        });

        it('"Back" from enterPhrase returns to "Recover account" heading', async () => {
            renderWithProviders(<ForgotPasswordHarness />);
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());

            await startRecovery(['email', 'sms', 'mnemonic']);
            await waitFor(() => expect(screen.getByRole('heading', { name: /Verify it.s you/ })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument());

            await user.click(screen.getByRole('button', { name: 'Try another way' }));
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /I don.t have my phrase/ })).toBeInTheDocument()
            );

            await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Back' }));

            await waitFor(() => expect(screen.getByRole('heading', { name: 'Recover account' })).toBeInTheDocument());
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
});
