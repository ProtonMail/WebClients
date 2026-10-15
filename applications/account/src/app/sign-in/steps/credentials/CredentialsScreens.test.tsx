import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromPromise } from 'xstate';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import type { SSOInfoResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { useFlag } from '@proton/unleash/useFlag';

import type { Paths } from '../../../content/helper';
import { SignInWizard } from '../../SignInWizard';
import { AuthType, type AuthTypeData } from '../../auth/interface';
import { SignInPageLayout } from '../../components/SignInPageLayout';
import { SignInStateMachine } from '../../state-machine/SignInStateMachine';
import { SignInContext } from '../../wizard/SignInContext';
import { SignInProvider } from '../../wizard/SignInProvider';
import type {
    AccountType,
    CredentialsFormValues,
    PrimaryAuthResult,
    SSOProviderResult,
} from './state-machine/credentialsActors';
import { InvalidLoginError, SSOSignInRejectedError } from './state-machine/credentialsErrors';
import { credentialsStateMachine } from './state-machine/credentialsStateMachine';

jest.mock('./useLoginChallenge', () => ({
    useLoginChallenge: () => ({ element: null, getPayload: () => Promise.resolve(undefined) }),
}));

jest.mock('../../../locales', () => jest.requireActual('../../../locales'));

jest.mock('@proton/unleash/useFlag');

const paths = {
    signup: '/signup',
    reset: '/reset-password',
    forgotUsername: '/forgot-username',
    signinHelp: '/sign-in-help',
    signinAnotherDevice: '/sign-in-with-qr',
} as unknown as Paths;

const renderForm = ({
    authTypeData = { type: AuthType.Srp },
    compactForm = false,
    testflight,
    authenticateWithPassword = jest.fn((_values: CredentialsFormValues) => new Promise<PrimaryAuthResult>(() => {})),
    authenticateWithSSOToken,
}: {
    authTypeData?: AuthTypeData;
    compactForm?: boolean;
    testflight?: 'vpn';
    authenticateWithPassword?: jest.Mock;
    /** Also signs in with the identity provider right away, without its window. */
    authenticateWithSSOToken?: jest.Mock;
} = {}) => {
    const machine = SignInStateMachine.provide({
        actors: {
            prepareSignIn: fromPromise(() => Promise.resolve()),
            credentialsFlow: credentialsStateMachine.provide({
                actors: {
                    startAuthSession: fromPromise(() => Promise.resolve()),
                    fetchAccountType: fromPromise(() => Promise.resolve<AccountType>({ type: 'srp' })),
                    authenticateWithPassword: fromPromise(({ input }) => authenticateWithPassword(input)),
                    ...(authenticateWithSSOToken && {
                        fetchSSOInfo: fromPromise(() =>
                            Promise.resolve({ SSOChallengeToken: 'challenge' } as SSOInfoResponse)
                        ),
                        authorizeWithSSOProvider: fromPromise(() =>
                            Promise.resolve<SSOProviderResult>({ uid: 'uid', token: 'token' })
                        ),
                        authenticateWithSSOToken: fromPromise(({ input }) => authenticateWithSSOToken(input)),
                    }),
                },
            }),
        },
    });
    renderWithProviders(
        <SignInContext.Provider
            logic={machine}
            options={{
                input: {
                    username: '',
                    authTypeData,
                    canNavigateBack: false,
                    setupVPN: false,
                    redirectsSSOToAccount: false,
                    externalSSO: undefined,
                    showSSONotice: false,
                },
            }}
        >
            <SignInProvider
                layout={SignInPageLayout}
                compactForm={compactForm}
                toApp={undefined}
                toAppName={undefined}
                showContinueTo={false}
                paths={paths}
                showRememberCheckbox
                testflight={testflight}
                isPorkbun={false}
                onError={jest.fn()}
            >
                <SignInWizard />
            </SignInProvider>
        </SignInContext.Provider>
    );
    return { authenticateWithPassword };
};

describe('the credentials screens', () => {
    afterEach(() => {
        jest.mocked(useFlag).mockReset();
    });

    it('asks for username and password, then submits them defaulting remember to true', async () => {
        const { authenticateWithPassword } = renderForm();
        const user = userEvent.setup();

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        await user.type(screen.getByLabelText('Email or username'), 'user@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() =>
            expect(authenticateWithPassword).toHaveBeenCalledWith({
                username: 'user@example.com',
                password: 'secret',
                persistent: true,
                payload: undefined,
            })
        );
    });

    it('keeps "Keep me signed in" off on the auto password screen when the username step turned it off', async () => {
        const { authenticateWithPassword } = renderForm({ authTypeData: { type: AuthType.Auto } });
        const user = userEvent.setup();

        expect(screen.getByLabelText('Keep me signed in')).toBeChecked();
        await user.click(screen.getByLabelText('Keep me signed in'));
        await user.type(screen.getByLabelText('Email or username'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        await user.type(await screen.findByLabelText('Enter your password'), 'secret');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() =>
            expect(authenticateWithPassword).toHaveBeenCalledWith(expect.objectContaining({ persistent: false }))
        );
    });

    it('does not submit empty fields', async () => {
        const { authenticateWithPassword } = renderForm();
        await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));
        expect(authenticateWithPassword).not.toHaveBeenCalled();
    });

    it('shows a wrong password inline and clears it when the user edits a field', async () => {
        renderForm({
            authenticateWithPassword: jest.fn(() =>
                Promise.reject(
                    new InvalidLoginError({
                        data: { Code: API_CUSTOM_ERROR_CODES.INVALID_LOGIN, Error: 'Wrong password' },
                    })
                )
            ),
        });
        const user = userEvent.setup();

        await user.type(screen.getByLabelText('Email or username'), 'user@example.com');
        await user.type(screen.getByLabelText('Password'), 'wrong');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByTestId('login:error-block')).toHaveTextContent('Wrong password');
        await user.type(screen.getByLabelText('Password'), 'x');
        await waitFor(() => expect(screen.queryByTestId('login:error-block')).not.toBeInTheDocument());
    });

    it.each([
        ['password', { type: AuthType.Srp }],
        ['auto', { type: AuthType.Auto }],
        ['SSO', { type: AuthType.ExternalSSO }],
    ] as const)(
        "shows the testflight variant's title and banner instead of the %s screen's title",
        (_, authTypeData) => {
            renderForm({ authTypeData, testflight: 'vpn' });
            expect(screen.getByRole('heading', { name: 'Sign in to join the Beta program' })).toBeInTheDocument();
            expect(screen.getByText(/to join the Proton VPN iOS Beta program/)).toBeInTheDocument();
            expect(screen.getByText(/You will be redirected to Apple Testflight/)).toBeInTheDocument();
        }
    );

    it('greets the account on the auto password screen, the testflight variant too', () => {
        renderForm({ authTypeData: { type: AuthType.AutoSrp, username: 'member@example.com' }, testflight: 'vpn' });
        expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
        expect(screen.queryByText('Sign in to join the Beta program')).not.toBeInTheDocument();
        expect(screen.queryByText(/to join the Proton VPN iOS Beta program/)).not.toBeInTheDocument();
        // The banner is about the whole sign-in, so it stays
        expect(screen.getByText(/You will be redirected to Apple Testflight/)).toBeInTheDocument();
    });

    it('shows the sign-up prompt and help links', () => {
        renderForm();
        expect(screen.getByText('Trouble signing in?')).toBeInTheDocument();
        expect(screen.getByText(/New to/)).toBeInTheDocument();
    });

    it('hides the sign-up prompt and help links in the compact form', () => {
        renderForm({ compactForm: true });
        expect(screen.queryByText('Trouble signing in?')).not.toBeInTheDocument();
        expect(screen.queryByText(/New to/)).not.toBeInTheDocument();
    });

    it('asks only for the username in the auto mode', () => {
        renderForm({ authTypeData: { type: AuthType.Auto } });
        expect(screen.getByTestId('login-form-auto')).toBeInTheDocument();
        expect(screen.getByLabelText('Email or username')).toBeInTheDocument();
        expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });

    it('does not submit an empty email with SSO', async () => {
        renderForm({ authTypeData: { type: AuthType.ExternalSSO } });
        await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));
        expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it("shows the API's refusal of the SSO sign-in inline and clears it when the user edits the email", async () => {
        const message = 'There is an error in the configuration of single sign-on';
        renderForm({
            authTypeData: { type: AuthType.ExternalSSO },
            authenticateWithSSOToken: jest.fn(() =>
                Promise.reject(new SSOSignInRejectedError({ status: 422, data: { Code: 2011, Error: message } }))
            ),
        });
        const user = userEvent.setup();

        await user.type(screen.getByLabelText('Email'), 'member@company.com');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByTestId('login:error-block')).toHaveTextContent(message);
        await user.type(screen.getByLabelText('Email'), 'x');
        await waitFor(() => expect(screen.queryByTestId('login:error-block')).not.toBeInTheDocument());
    });

    it('asks only for the email with SSO, and switches to the password form on request', async () => {
        renderForm({ authTypeData: { type: AuthType.ExternalSSO } });
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();

        const user = userEvent.setup();
        await user.type(screen.getByLabelText('Email'), 'member@company.com');
        await user.click(screen.getByRole('button', { name: 'Sign in with password' }));

        expect(await screen.findByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        // The email typed in the SSO form carries over
        expect(screen.getByLabelText('Email or username')).toHaveValue('member@company.com');
    });

    it('keeps the Lumo help open, with its conversation, across a mode switch', async () => {
        jest.mocked(useFlag).mockImplementation((flag) => flag === 'LumoSignInHelp');
        renderForm({ authTypeData: { type: AuthType.ExternalSSO } });
        const user = userEvent.setup();
        const launcher = () => screen.getByRole('button', { name: 'Get help from Lumo' });

        await user.click(launcher());
        const conversation = screen.getByTitle('Troubleshoot with Lumo');
        const page = screen.getByRole('main');

        await user.click(screen.getByRole('button', { name: 'Sign in with password' }));
        expect(await screen.findByLabelText('Password')).toBeInTheDocument();

        // The layout is rendered once, so the switch keeps the page, and the panel in it
        expect(screen.getByRole('main')).toBe(page);
        expect(launcher()).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByTitle('Troubleshoot with Lumo')).toBe(conversation);
    });
});
