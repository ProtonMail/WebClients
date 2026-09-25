import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { fromCallback, fromPromise } from 'xstate';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { TOTPError } from '@proton/shared/lib/authentication/error';
import type { KeySalt, User } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../content/authSession';
import type { Paths } from '../content/helper';
import { SignInWizard } from './SignInWizard';
import { AuthType, type AuthTypeData, type SSODataTypes, SSOLoginCapabilites } from './auth/interface';
import type { PrepareSSOResult } from './auth/sso';
import { SignInPageLayout } from './components/SignInPageLayout';
import { RememberMode } from './rememberMode';
import { SignInStateMachine } from './state-machine/SignInStateMachine';
import type { CreatedAuth } from './state-machine/signInActors';
import type { SignInAuthState } from './state-machine/signInAuthState';
import type { PrimaryAuthResult } from './steps/credentials/state-machine/credentialsActors';
import { credentialsStateMachine } from './steps/credentials/state-machine/credentialsStateMachine';
import { lost2FAStateMachine } from './steps/password-account/screens/lost-two-factor/state-machine/lost2FAStateMachine';
import { createLost2FAFlow } from './steps/password-account/screens/lost-two-factor/state-machine/verificationActors';
import { passwordAccountStateMachine } from './steps/password-account/state-machine/passwordAccountStateMachine';
import { ssoStateMachine } from './steps/sso/state-machine/ssoStateMachine';
import { SignInContext } from './wizard/SignInContext';
import { SignInProvider } from './wizard/SignInProvider';

jest.mock('./steps/credentials/useLoginChallenge', () => ({
    useLoginChallenge: () => ({ element: null, getPayload: () => Promise.resolve(undefined) }),
}));

jest.mock('../locales', () => jest.requireActual('../locales'));

// The email verification sends a code when it opens; it stays pending here
const mockInitiateVerification = jest.fn(() => new Promise<never>(() => {}));
const mockSendNewCode = jest.fn(() => new Promise<never>(() => {}));
jest.mock('@proton/account/safetyReview/verification/verification', () => ({
    ...jest.requireActual('@proton/account/safetyReview/verification/verification'),
    initiateVerification: (...args: unknown[]) => mockInitiateVerification(...(args as [])),
    sendNewCode: () => mockSendNewCode(),
}));

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

// Counts its renders, so a test can tell the loader never showed, not even for one render
const mockLoaderPage = jest.fn();
jest.mock('@proton/components/containers/app/LoaderPage', () => ({
    __esModule: true,
    default: () => {
        mockLoaderPage();
        return null;
    },
}));

const ssoData = {
    type: 'unlock',
    intent: {
        step: SSOLoginCapabilites.ENTER_BACKUP_PASSWORD,
        capabilities: new Set([SSOLoginCapabilites.ENTER_BACKUP_PASSWORD]),
    },
    organizationData: {
        logo: { cleanup: jest.fn() },
        passwordPolicies: [],
        identity: { FingerprintSignatureAddress: 'admin@example.com' },
        organization: { Name: 'Example' },
    },
    authDevices: [],
} as unknown as SSODataTypes;

const auth = {
    credentials: {
        authType: AuthType.ExternalSSO,
        username: 'member@example.com',
        loginPassword: '',
        authResponse: {},
    },
    account: {},
} as unknown as SignInAuthState;

/** Renders the wizard with the machine. With the identity provider's redirect token the credentials step signs in
 * straight through to the account flow `createAuthState` picks, no typing needed. */
const renderWizard = (
    machine: typeof SignInStateMachine,
    {
        withRedirectToken = true,
        showSSONotice = false,
        authTypeData = { type: AuthType.ExternalSSO },
    }: { withRedirectToken?: boolean; showSSONotice?: boolean; authTypeData?: AuthTypeData } = {}
) => {
    renderWithProviders(
        <SignInContext.Provider
            logic={machine}
            options={{
                input: {
                    username: 'member@example.com',
                    authTypeData,
                    canNavigateBack: false,
                    setupVPN: false,
                    redirectsSSOToAccount: false,
                    externalSSO: withRedirectToken ? { token: 'redirect-token', persistent: false } : undefined,
                    showSSONotice,
                },
            }}
        >
            <SignInProvider
                layout={SignInPageLayout}
                compactForm={false}
                toApp={undefined}
                toAppName={undefined}
                showContinueTo={false}
                paths={{} as Paths}
                remember={RememberMode.Visible}
                testflight={undefined}
                isPorkbun={false}
                onError={jest.fn()}
            >
                <SignInWizard />
            </SignInProvider>
        </SignInContext.Provider>
    );
};

/**
 * Opens the sign-in on the SSO form. With the identity provider's redirect token it signs in straight through to
 * the SSO account flow, no typing needed.
 */
type SSOActors = NonNullable<Parameters<typeof ssoStateMachine.provide>[0]['actors']>;

const renderSignInOnSSO = ({
    withRedirectToken = true,
    showSSONotice = false,
    data = ssoData,
    ssoActors = {},
}: { withRedirectToken?: boolean; showSSONotice?: boolean; data?: SSODataTypes; ssoActors?: SSOActors } = {}) => {
    const machine = SignInStateMachine.provide({
        actors: {
            credentialsFlow: credentialsStateMachine.provide({
                actors: {
                    startAuthSession: fromPromise(() => Promise.resolve()),
                    authenticateWithSSOToken: fromPromise(() => Promise.resolve({} as PrimaryAuthResult)),
                },
            }),
            prepareSignIn: fromPromise(() => Promise.resolve()),
            createAuthState: fromPromise(() =>
                Promise.resolve<CreatedAuth>({
                    auth,
                    authTypes: { twoFactor: { enabled: false, totp: false, fido2: false }, unlock: false },
                })
            ),
            ssoFlow: ssoStateMachine.provide({
                actors: {
                    loadAccount: fromPromise(async () => ({
                        user: { Keys: [{}] } as unknown as User,
                        salts: [] as KeySalt[],
                    })),
                    prepareSSO: fromPromise(async (): Promise<PrepareSSOResult> => ({ type: 'sso', ssoData: data })),
                    waitForDeviceApproval: fromCallback(() => () => {}),
                    ...ssoActors,
                },
            }),
        },
    });
    renderWizard(machine, { withRedirectToken, showSSONotice });
};

type PasswordAccountActors = NonNullable<Parameters<typeof passwordAccountStateMachine.provide>[0]['actors']>;

/** Signs in with a password account that has TOTP two-factor and the given recovery methods. */
const renderSignInWithTwoFactor = (
    recoveryMethods: { email?: boolean; phone?: boolean; phrase?: boolean },
    passwordAccountActors: PasswordAccountActors = {}
) => {
    const passwordAuth = {
        credentials: {
            authType: AuthType.Srp,
            username: 'member@example.com',
            loginPassword: 'secret',
            authResponse: {
                HasRecoveryEmail: !!recoveryMethods.email,
                HasRecoveryPhone: !!recoveryMethods.phone,
                HasRecoveryPhrase: !!recoveryMethods.phrase,
            },
        },
        account: {},
    } as unknown as SignInAuthState;
    const machine = SignInStateMachine.provide({
        actors: {
            credentialsFlow: credentialsStateMachine.provide({
                actors: {
                    startAuthSession: fromPromise(() => Promise.resolve()),
                    authenticateWithSSOToken: fromPromise(() => Promise.resolve({} as PrimaryAuthResult)),
                },
            }),
            prepareSignIn: fromPromise(() => Promise.resolve()),
            passwordAccountFlow: passwordAccountStateMachine.provide({
                // The real lost-2FA flow; its requests stay pending (see the verification mock above)
                actors: {
                    lostTwoFactorFlow: createLost2FAFlow({ api: () => new Promise(() => {}) }),
                    ...passwordAccountActors,
                },
            }),
            createAuthState: fromPromise(() =>
                Promise.resolve<CreatedAuth>({
                    auth: passwordAuth,
                    authTypes: { twoFactor: { enabled: true, totp: true, fido2: false }, unlock: false },
                })
            ),
        },
    });
    renderWizard(machine);
};

/** From the two-factor screen into the lost-2FA flow, which starts with the backup codes. */
const openLostTwoFactor = async () => {
    fireEvent.click(await screen.findByRole('button', { name: "I don't have my 2FA device" }));
    expect(await screen.findByText('Use backup recovery code')).toBeInTheDocument();
};

/** Each lost-2FA screen is framed by `Lost2FAStepLayout`: its title, and the account's username. */
const expectLost2FAFrame = (title: string) => {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText('member@example.com')).toBeInTheDocument();
};

/** Past the backup codes, to the first recovery method the account has. */
const skipBackupCodes = () => fireEvent.click(screen.getByRole('button', { name: 'I don’t have my backup codes' }));

/** Fills all six boxes at once, which submits the code. */
const enterTotp = async () => {
    expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
    const [firstBox] = screen.getAllByRole('textbox');
    // Async, so the code's check (which settles right away in tests) updates the form inside `act`
    await act(async () => {
        fireEvent.change(firstBox, { target: { value: '123456' } });
    });
};

/** The layout has a Back button for each screen size. */
const clickBack = () => fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]);

describe('SignInWizard', () => {
    it('shows the SSO notice when the page opens the SSO form with it', async () => {
        renderSignInOnSSO({ withRedirectToken: false, showSSONotice: true });
        expect(await screen.findByLabelText('Email')).toBeInTheDocument();
        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({ text: expect.stringContaining('single sign-on (SSO)') })
        );
    });

    it('shows the SSO account flow screen, with the data the flow loaded', async () => {
        renderSignInOnSSO();
        expect(await screen.findByText('Enter your backup password')).toBeInTheDocument();
        expect(screen.getByLabelText('Backup password')).toBeInTheDocument();
    });

    it('shows a wrong two-factor code under the code field, without a notification', async () => {
        mockCreateNotification.mockClear();
        renderSignInWithTwoFactor(
            {},
            { verifyTwoFactor: fromPromise(() => Promise.reject(new TOTPError('Incorrect code'))) }
        );
        await enterTotp();
        expect(await screen.findByText('Incorrect code')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
        expect(mockCreateNotification).not.toHaveBeenCalled();

        // Typing a new code clears it
        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '9' } });
        expect(screen.queryByText('Incorrect code')).not.toBeInTheDocument();
    });

    it('keeps the back button on the auto password step once the password is accepted, and ignores it', async () => {
        const createAuthState = jest.fn(() => new Promise<CreatedAuth>(() => {}));
        const machine = SignInStateMachine.provide({
            actors: {
                credentialsFlow: credentialsStateMachine.provide({
                    actors: {
                        startAuthSession: fromPromise(() => Promise.resolve()),
                        authenticateWithPassword: fromPromise(() => Promise.resolve({} as PrimaryAuthResult)),
                    },
                }),
                prepareSignIn: fromPromise(() => Promise.resolve()),
                // The next step is being prepared: the password step stays up, loading
                createAuthState: fromPromise(createAuthState),
            },
        });
        renderWizard(machine, {
            withRedirectToken: false,
            authTypeData: { type: AuthType.AutoSrp, username: 'member@example.com' },
        });
        fireEvent.change(await screen.findByLabelText('Enter your password'), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        await waitFor(() => expect(createAuthState).toHaveBeenCalled());

        expect(screen.getAllByRole('button', { name: 'Back' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'member@example.com' })).toBeDisabled();
        clickBack();
        expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
        expect(screen.getByLabelText('Enter your password')).toBeInTheDocument();
    });

    it('keeps the backup password button while the administrator is asked, and ignores it', async () => {
        const requestAdminApproval = jest.fn(() => new Promise<void>(() => {}));
        renderSignInOnSSO({
            data: {
                ...ssoData,
                intent: {
                    step: SSOLoginCapabilites.ASK_ADMIN,
                    capabilities: new Set([SSOLoginCapabilites.ASK_ADMIN, SSOLoginCapabilites.ENTER_BACKUP_PASSWORD]),
                },
            } as SSODataTypes,
            ssoActors: { requestAdminApproval: fromPromise(requestAdminApproval) },
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Contact administrator' }));
        await waitFor(() => expect(requestAdminApproval).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('button', { name: 'Use backup password instead' }));
        expect(screen.getByRole('heading', { name: 'Ask your administrator for access?' })).toBeInTheDocument();
    });

    describe('lost two-factor', () => {
        it('opens the backup codes from the two-factor screen', async () => {
            renderSignInWithTwoFactor({});
            expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
            await openLostTwoFactor();
            expectLost2FAFrame('Use backup recovery code');
            expect(screen.getByRole('button', { name: 'Authenticate' })).toBeInTheDocument();
        });

        it('verifies with the recovery email', async () => {
            renderSignInWithTwoFactor({ email: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText('Disable two-factor authentication?')).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
            // The code is being sent
            expect(mockInitiateVerification).toHaveBeenCalledWith(expect.objectContaining({ method: 'email' }));
        });

        it('verifies with the recovery phone', async () => {
            renderSignInWithTwoFactor({ phone: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByRole('button', { name: 'Send code' })).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('verifies with the recovery phrase', async () => {
            renderSignInWithTwoFactor({ phrase: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText(/Enter your recovery phrase/)).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('offers support when the account has no recovery method', async () => {
            renderSignInWithTwoFactor({});
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText('Contact Support Center')).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('clears the typed code once a new one is sent', async () => {
            mockInitiateVerification.mockImplementationOnce(
                () =>
                    Promise.resolve({
                        token: 'token',
                        verificationDataResult: { ChallengeDestination: 'r***@example.com' },
                    }) as never
            );
            mockSendNewCode.mockImplementationOnce(() => Promise.resolve() as never);
            const typedCode = () =>
                screen
                    .getAllByRole('textbox')
                    .map((box) => (box as HTMLInputElement).value)
                    .join('');
            renderSignInWithTwoFactor({ email: true });
            await openLostTwoFactor();
            skipBackupCodes();
            fireEvent.change((await screen.findAllByRole('textbox'))[0], { target: { value: '123456' } });
            expect(typedCode()).toBe('123456');

            fireEvent.click(screen.getByRole('button', { name: "Didn't receive a code?" }));
            expect(await screen.findByText('Request new code?')).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Send new code', hidden: true }));
            await waitFor(() => expect(typedCode()).toBe(''));
        });

        it('keeps the backup code form up, loading, while a valid code signs in', async () => {
            mockLoaderPage.mockClear();
            const completeSignIn = jest.fn(() => new Promise<void>(() => {}));
            renderSignInWithTwoFactor(
                {},
                {
                    // The lost-2FA flow checks the backup code itself
                    lostTwoFactorFlow: lost2FAStateMachine.provide({
                        actors: { verifyBackupCode: fromPromise(() => Promise.resolve()) },
                    }),
                    loadAccount: fromPromise(async () => ({
                        user: { Keys: [{}] } as unknown as User,
                        salts: [] as KeySalt[],
                    })),
                    unlockKeys: fromPromise(async () => ({}) as AuthSession),
                    completeSignIn: fromPromise(completeSignIn),
                }
            );
            await openLostTwoFactor();
            fireEvent.change(screen.getByRole('textbox'), { target: { value: 'backup12' } });
            fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));

            await waitFor(() => expect(completeSignIn).toHaveBeenCalled());
            expectLost2FAFrame('Use backup recovery code');
            expect(screen.getByRole('button', { name: /Authenticate/ })).toHaveAttribute('aria-busy', 'true');
            expect(mockLoaderPage).not.toHaveBeenCalled();
        });
    });

    /**
     * `PasswordAccountStep` and `SSOStep` fall back to the loader once their flow is gone. It is not meant to be
     * seen: ending the flow either leaves the step in the same transition, or hands the session to the app first.
     */
    describe('when an account flow ends', () => {
        beforeEach(() => mockLoaderPage.mockClear());

        it('goes back to the credentials form without the loader when leaving the password account flow', async () => {
            renderSignInWithTwoFactor({});
            expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
            clickBack();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(mockLoaderPage).not.toHaveBeenCalled();
        });

        it('goes back to the credentials form without the loader when leaving the SSO flow', async () => {
            renderSignInOnSSO();
            expect(await screen.findByText('Enter your backup password')).toBeInTheDocument();
            clickBack();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(mockLoaderPage).not.toHaveBeenCalled();
        });

        it('goes back to the credentials form without the loader when the password account flow fails', async () => {
            renderSignInWithTwoFactor({}, { verifyTwoFactor: fromPromise(() => Promise.reject(new Error('Offline'))) });
            await enterTotp();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(mockLoaderPage).not.toHaveBeenCalled();
        });

        it('shows the loader only once the session is handed to the app, which leaves the page', async () => {
            let handOver!: () => void;
            const completeSignIn = jest.fn(
                () =>
                    new Promise<void>((resolve) => {
                        handOver = resolve;
                    })
            );
            renderSignInWithTwoFactor(
                {},
                {
                    verifyTwoFactor: fromPromise(() => Promise.resolve()),
                    loadAccount: fromPromise(async () => ({
                        user: { Keys: [{}] } as unknown as User,
                        salts: [] as KeySalt[],
                    })),
                    unlockKeys: fromPromise(async () => ({}) as AuthSession),
                    completeSignIn: fromPromise(completeSignIn),
                }
            );
            await enterTotp();

            // The app takes over (`onLogin`) while the two-factor screen stays up, loading
            await waitFor(() => expect(completeSignIn).toHaveBeenCalled());
            expect(screen.getByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            expect(mockLoaderPage).not.toHaveBeenCalled();

            // Only here, where the app has already navigated away and unmounts the sign-in
            await act(async () => handOver());
            await waitFor(() => expect(mockLoaderPage).toHaveBeenCalled());
        });
    });
});
