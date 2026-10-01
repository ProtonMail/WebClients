import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { fromCallback, fromPromise } from 'xstate';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { TelemetryUnauthLost2FAEvents } from '@proton/shared/lib/api/telemetry';
import { SecondPasswordError, TOTPError } from '@proton/shared/lib/authentication/error';
import type { KeySalt, User } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../content/authSession';
import type { Paths } from '../content/helper';
import { SignInWizard } from './SignInWizard';
import { AuthType, type AuthTypeData, type SSODataTypes, SSOLoginCapabilites } from './auth/interface';
import type { PrepareSSOResult, SSOSignInResult } from './auth/sso';
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
import { type SSODeviceEvent, ssoStateMachine } from './steps/sso/state-machine/ssoStateMachine';
import { SignInContext } from './wizard/SignInContext';
import { SignInProvider } from './wizard/SignInProvider';

jest.mock('./steps/credentials/useLoginChallenge', () => ({
    useLoginChallenge: () => ({ element: null, getPayload: () => Promise.resolve(undefined) }),
}));

jest.mock('../locales', () => jest.requireActual('../locales'));

const mockSendTelemetryReport = jest.fn();
jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/metrics'),
    sendTelemetryReport: (...args: unknown[]) => mockSendTelemetryReport(...args),
    telemetryReportsBatchQueue: { flush: () => Promise.resolve() },
}));

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
    const wizard = () => (
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
    const { rerender } = renderWithProviders(wizard());
    // Renders the page again, as its parents may at any time; with the same machine, the sign-in carries on where it is
    return { rerender: () => rerender(wizard()) };
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

/** A password account with TOTP two-factor, the default for `renderPasswordSignIn`. */
const TWO_FACTOR_AUTH_TYPES: CreatedAuth['authTypes'] = {
    twoFactor: { enabled: true, totp: true, fido2: false },
    unlock: false,
};

/** Leaves the page for the password reset, which the app provides (`useSignInMachine`). */
const goToResetPassword = jest.fn();

/** Signs in with a password account with these auth types (by default TOTP two-factor) and recovery methods. */
const renderPasswordSignIn = (
    recoveryMethods: { email?: boolean; phone?: boolean; phrase?: boolean },
    passwordAccountActors: PasswordAccountActors = {},
    authTypes: CreatedAuth['authTypes'] = TWO_FACTOR_AUTH_TYPES
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
                    authenticateWithPassword: fromPromise(() => Promise.resolve({} as PrimaryAuthResult)),
                },
            }),
            prepareSignIn: fromPromise(() => Promise.resolve()),
            passwordAccountFlow: passwordAccountStateMachine.provide({
                // The real lost-2FA flow; its requests stay pending (see the verification mock above)
                actors: {
                    lostTwoFactorFlow: createLost2FAFlow({ api: () => new Promise(() => {}) }),
                    ...passwordAccountActors,
                },
                actions: { goToResetPassword: (_, params) => goToResetPassword(params) },
            }),
            createAuthState: fromPromise(() =>
                Promise.resolve<CreatedAuth>({
                    auth: passwordAuth,
                    authTypes,
                })
            ),
        },
    });
    return renderWizard(machine);
};

/** From the two-factor screen into the lost-2FA flow, which starts with the backup codes. */
const openLostTwoFactor = async () => {
    fireEvent.click(await screen.findByRole('button', { name: "I don't have my 2FA device" }));
    expect(await screen.findByText('Use backup recovery code')).toBeInTheDocument();
};

/** Each lost-2FA screen shows its title, and the account’s username under it (`Lost2FAUsername`). */
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

/**
 * The page has a Back button for each screen size: the layout's top bar, for small screens, then the screen's heading,
 * which each screen wires itself. This clicks the heading's.
 */
const clickBack = () => fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[1]);

/** The layout's top bar's Back button, for small screens. */
const clickTopBarBack = () => fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]);

describe('SignInWizard', () => {
    it('leaves out the subtitle of a screen that has none', async () => {
        // The SSO form's subtitle is the app the sign-in continues to, and this one continues to none
        renderSignInOnSSO({ withRedirectToken: false });
        expect(await screen.findByRole('heading', { name: 'Sign in to your organization' })).toBeInTheDocument();
        expect(screen.queryByTestId('public-main-header:subtitle')).not.toBeInTheDocument();
    });

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
        renderPasswordSignIn(
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

    it('shows a wrong second password under the field, without a notification', async () => {
        mockCreateNotification.mockClear();
        renderPasswordSignIn(
            {},
            {
                loadAccount: fromPromise(async () => ({
                    user: { Keys: [{}] } as unknown as User,
                    salts: [] as KeySalt[],
                })),
                unlockKeys: fromPromise(() => Promise.reject(new SecondPasswordError())),
            },
            { twoFactor: { enabled: false, totp: false, fido2: false }, unlock: true }
        );
        fireEvent.change(await screen.findByLabelText('Second password'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
        expect(await screen.findByText('Incorrect second password. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Unlock your data' })).toBeInTheDocument();
        expect(mockCreateNotification).not.toHaveBeenCalled();

        // Typing a new password clears it
        fireEvent.change(screen.getByLabelText('Second password'), { target: { value: 'another' } });
        expect(screen.queryByText('Incorrect second password. Please try again.')).not.toBeInTheDocument();
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

    it('shows the sign-in loading once another device approves, instead of the ways out', async () => {
        let approve = () => {};
        renderSignInOnSSO({
            data: {
                ...ssoData,
                address: { Email: 'member@example.com' },
                deviceData: { deviceOutput: {}, deviceSecretData: { confirmationCodes: ['ABCD', 'ABCD', 'ABCD'] } },
                intent: {
                    step: SSOLoginCapabilites.OTHER_DEVICES,
                    capabilities: new Set([
                        SSOLoginCapabilites.OTHER_DEVICES,
                        SSOLoginCapabilites.ENTER_BACKUP_PASSWORD,
                    ]),
                },
            } as unknown as SSODataTypes,
            ssoActors: {
                waitForDeviceApproval: fromCallback<SSODeviceEvent, { auth: SignInAuthState }>(({ sendBack }) => {
                    approve = () =>
                        sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser: {} as never } });
                    return () => {};
                }),
                // The approved device signs in, and the app then takes the page away
                confirmSSODevice: fromPromise(() => new Promise<SSOSignInResult>(() => {})),
            },
        });
        expect(
            await screen.findByRole('heading', { name: 'Approve the sign-in from another device' })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Use backup password instead' })).toBeInTheDocument();

        act(() => approve());
        // The code stays, marked approved, and the sign-in shows as a busy button in place of the ways out
        expect(await screen.findByText('Approved')).toBeInTheDocument();
        expect(screen.getByTestId('sso:confirmation-code')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Signing in/ })).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByRole('button', { name: 'Use backup password instead' })).not.toBeInTheDocument();
    });

    it('keeps the page when the SSO flow moves to another screen', async () => {
        renderSignInOnSSO({
            data: {
                ...ssoData,
                intent: {
                    step: SSOLoginCapabilites.ASK_ADMIN,
                    capabilities: new Set([SSOLoginCapabilites.ASK_ADMIN, SSOLoginCapabilites.ENTER_BACKUP_PASSWORD]),
                },
            } as SSODataTypes,
        });
        expect(await screen.findByRole('heading', { name: 'Ask your administrator for access?' })).toBeInTheDocument();
        const page = screen.getByRole('main');

        fireEvent.click(screen.getByRole('button', { name: 'Use backup password instead' }));
        expect(await screen.findByRole('heading', { name: 'Enter your backup password' })).toBeInTheDocument();
        expect(screen.getByRole('main')).toBe(page);
    });

    it('keeps the page when the sign-in moves between steps', async () => {
        renderSignInOnSSO();
        expect(await screen.findByText('Enter your backup password')).toBeInTheDocument();
        const page = screen.getByRole('main');

        // Back from the SSO flow returns to the credentials step
        clickBack();
        expect(await screen.findByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByRole('main')).toBe(page);
    });

    describe('lost two-factor', () => {
        it('keeps the page between its screens', async () => {
            renderPasswordSignIn({ email: true });
            await openLostTwoFactor();
            const page = screen.getByRole('main');

            skipBackupCodes();
            expect(
                await screen.findByRole('heading', { name: 'Disable two-factor authentication?' })
            ).toBeInTheDocument();
            expect(screen.getByRole('main')).toBe(page);
        });

        it('opens the backup codes from the two-factor screen', async () => {
            renderPasswordSignIn({});
            expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
            await openLostTwoFactor();
            expectLost2FAFrame('Use backup recovery code');
            expect(screen.getByRole('button', { name: 'Authenticate' })).toBeInTheDocument();
        });

        it('verifies with the recovery email', async () => {
            renderPasswordSignIn({ email: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText('Disable two-factor authentication?')).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
            // The code is being sent
            expect(mockInitiateVerification).toHaveBeenCalledWith(expect.objectContaining({ method: 'email' }));
        });

        it('verifies with the recovery phone', async () => {
            renderPasswordSignIn({ phone: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByRole('button', { name: 'Send code' })).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('verifies with the recovery phrase', async () => {
            renderPasswordSignIn({ phrase: true });
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText(/Enter your recovery phrase/)).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('offers support when the account has no recovery method', async () => {
            renderPasswordSignIn({});
            await openLostTwoFactor();
            skipBackupCodes();
            expect(await screen.findByText('Contact Support Center')).toBeInTheDocument();
            expectLost2FAFrame('Disable two-factor authentication?');
        });

        it('keeps its last screen up while the page leaves to reset the password', async () => {
            goToResetPassword.mockClear();
            const { rerender } = renderPasswordSignIn({});
            await openLostTwoFactor();
            skipBackupCodes();
            fireEvent.click(await screen.findByRole('button', { name: 'Recover account' }));
            expect(goToResetPassword).toHaveBeenCalledWith({ username: 'member@example.com' });

            // The next page loads: the screen stays up, loading, even if the page renders again
            rerender();
            expectLost2FAFrame('Disable two-factor authentication?');
            expect(screen.getByRole('button', { name: /Recover account/ })).toHaveAttribute('aria-busy', 'true');
        });

        it('goes back to the two-factor screen, and opens a new flow from there', async () => {
            renderPasswordSignIn({});
            await openLostTwoFactor();
            clickBack();
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            // A new flow, the password flow's child under the stopped one's id
            await openLostTwoFactor();
            expectLost2FAFrame('Use backup recovery code');
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
            renderPasswordSignIn({ email: true });
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
            const completeSignIn = jest.fn(() => new Promise<void>(() => {}));
            renderPasswordSignIn(
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
            const page = screen.getByRole('main');
            fireEvent.change(screen.getByRole('textbox'), { target: { value: 'backup12' } });
            fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));

            await waitFor(() => expect(completeSignIn).toHaveBeenCalled());
            expectLost2FAFrame('Use backup recovery code');
            expect(screen.getByRole('button', { name: /Authenticate/ })).toHaveAttribute('aria-busy', 'true');
            // The same page throughout: had it rendered nothing in between, its main element would be a new one
            expect(screen.getByRole('main')).toBe(page);
        });

        it('reports each backup code and how the flow ended, in telemetry', async () => {
            mockSendTelemetryReport.mockClear();
            renderPasswordSignIn(
                {},
                {
                    // A wrong code, so the form takes back again once it's checked
                    lostTwoFactorFlow: lost2FAStateMachine.provide({
                        actors: {
                            verifyBackupCode: fromPromise(() => Promise.reject(new TOTPError('Incorrect code'))),
                        },
                    }),
                }
            );
            await openLostTwoFactor();
            const flowOutcomes = () =>
                mockSendTelemetryReport.mock.calls.flatMap(([report]) =>
                    report.event === TelemetryUnauthLost2FAEvents.flow_outcome ? [report.dimensions.outcome] : []
                );

            const stepLoads = () =>
                mockSendTelemetryReport.mock.calls.flatMap(([report]) =>
                    report.event === TelemetryUnauthLost2FAEvents.step_load ? [report.dimensions.step] : []
                );

            fireEvent.change(screen.getByRole('textbox'), { target: { value: 'backup12' } });
            fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));
            expect(flowOutcomes()).toEqual(['totp backup code provided']);
            expect(await screen.findByText('Incorrect code')).toBeInTheDocument();
            // The code is asked for again, on the same step, which loaded once
            expect(stepLoads()).toEqual(['request totp backup codes']);

            // Back from the backup codes, the account's only way here, returns to the two-factor screen
            clickBack();
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            expect(flowOutcomes()).toEqual(['totp backup code provided', 'return to 2fa step']);
        });
    });

    describe('when an account flow ends', () => {
        // The same page throughout: had it rendered nothing in between, its main element would be a new one
        it('goes back to the credentials form when leaving the password account flow', async () => {
            renderPasswordSignIn({});
            expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
            const page = screen.getByRole('main');
            // The small screens' back, from the layout's top bar; the other tests use the heading's
            clickTopBarBack();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByRole('main')).toBe(page);
        });

        it('signs in again after going back to the credentials form', async () => {
            renderPasswordSignIn({});
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            const page = screen.getByRole('main');
            clickBack();
            // The reopened credentials step, its redirect token used: the SSO form, then the password form
            fireEvent.click(await screen.findByRole('button', { name: 'Sign in with password' }));
            fireEvent.change(await screen.findByLabelText('Password'), { target: { value: 'secret' } });
            fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
            // A new password account flow, the sign-in's child under the stopped one's id
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            expect(screen.getByRole('main')).toBe(page);
        });

        it('goes back to the credentials form when leaving the SSO flow', async () => {
            renderSignInOnSSO();
            expect(await screen.findByText('Enter your backup password')).toBeInTheDocument();
            const page = screen.getByRole('main');
            clickBack();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByRole('main')).toBe(page);
        });

        it('goes back to the credentials form when the password account flow fails', async () => {
            renderPasswordSignIn({}, { verifyTwoFactor: fromPromise(() => Promise.reject(new Error('Offline'))) });
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            const page = screen.getByRole('main');
            await enterTotp();
            expect(await screen.findByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByRole('main')).toBe(page);
        });

        it('keeps the two-factor screen up, loading, once the session is handed to the app', async () => {
            const completeSignIn = jest.fn(() => Promise.resolve());
            renderPasswordSignIn(
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
            expect(await screen.findByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            const page = screen.getByRole('main');
            await enterTotp();

            // The app has the session (`onLogin`); the screen stays up, loading, until the app takes the page away
            await waitFor(() => expect(completeSignIn).toHaveBeenCalled());
            await act(async () => {});
            expect(screen.getByRole('heading', { name: 'Two-factor authentication' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Authenticat/ })).toHaveAttribute('aria-busy', 'true');
            expect(screen.getByRole('main')).toBe(page);
        });
    });
});
