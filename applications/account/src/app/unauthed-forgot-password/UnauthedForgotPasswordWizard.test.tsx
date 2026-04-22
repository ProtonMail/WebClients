import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { UnauthedForgotPassword } from './UnauthedForgotPassword';
import { handleRequestRecoveryMethods } from './actions';

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
    }),
}));

jest.mock('./hooks/useRequestCode', () => ({
    useRequestCode:
        ({ onSuccess }: { onSuccess: () => void }) =>
        () =>
            Promise.resolve().then(onSuccess),
}));

jest.mock('../locales', () => jest.requireActual('../locales'));

function ForgotPasswordHarness() {
    return (
        <UnauthedForgotPassword
            onLogin={jest.fn()}
            onPreSubmit={() => Promise.resolve()}
            onStartAuth={() => Promise.resolve()}
            productParam="generic"
            setupVPN={false}
            toApp={undefined}
            loginUrl="/login"
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
});
