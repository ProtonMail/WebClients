import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromPromise } from 'xstate';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { Paths } from '../../../content/helper';
import { AuthType, type AuthTypeData } from '../../auth/interface';
import { SignInPageLayout } from '../../components/SignInPageLayout';
import { RememberMode } from '../../rememberMode';
import { SignInStateMachine } from '../../state-machine/SignInStateMachine';
import { SignInContext } from '../../wizard/SignInContext';
import { SignInProvider } from '../../wizard/SignInProvider';
import { CredentialsContext } from './CredentialsContext';
import LoginForm from './LoginForm';
import type { CredentialsFormValues, PrimaryAuthResult } from './state-machine/credentialsActors';
import { credentialsStateMachine } from './state-machine/credentialsStateMachine';

/** The form, with the credentials step's actor from the sign-in, as `CredentialsStep` provides it. */
const LoginFormInStep = () => {
    const credentialsRef = SignInContext.useSelector((snapshot) => snapshot.children.credentials);
    return credentialsRef ? (
        <CredentialsContext.Provider value={credentialsRef}>
            <LoginForm />
        </CredentialsContext.Provider>
    ) : null;
};

jest.mock('./useLoginChallenge', () => ({
    useLoginChallenge: () => ({ element: null, getPayload: () => Promise.resolve(undefined) }),
}));

jest.mock('../../../locales', () => jest.requireActual('../../../locales'));

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
    authenticateWithPassword = jest.fn((_values: CredentialsFormValues) => new Promise<PrimaryAuthResult>(() => {})),
}: {
    authTypeData?: AuthTypeData;
    compactForm?: boolean;
    authenticateWithPassword?: jest.Mock;
} = {}) => {
    const machine = SignInStateMachine.provide({
        actors: {
            prepareSignIn: fromPromise(() => Promise.resolve()),
            credentialsFlow: credentialsStateMachine.provide({
                actors: {
                    startAuthSession: fromPromise(() => Promise.resolve()),
                    authenticateWithPassword: fromPromise(({ input }) => authenticateWithPassword(input)),
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
                remember={RememberMode.Visible}
                testflight={undefined}
                isPorkbun={false}
                onError={jest.fn()}
            >
                <LoginFormInStep />
            </SignInProvider>
        </SignInContext.Provider>
    );
    return { authenticateWithPassword };
};

describe('LoginForm', () => {
    it('asks for username and password, then submits them with the remember choice', async () => {
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
                persistent: false,
                payload: undefined,
            })
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
                Promise.reject({ data: { Code: API_CUSTOM_ERROR_CODES.INVALID_LOGIN, Error: 'Wrong password' } })
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
});
