import { act, fireEvent, render, screen } from '@testing-library/react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';

import { SignupType } from '../../../signup/interfaces';
import { AccountFormDataContextProvider, useAccountFormDataContext } from './AccountFormDataContext';
import { defaultAsyncValidationState } from './asyncValidator/createAsyncValidator';
import { validateEmailAvailability, validateUsernameAvailability } from './asyncValidator/validateEmail';

jest.mock('@proton/components/hooks/useSilentApi');
jest.mock('./asyncValidator/validateEmail');
jest.mock('../../../signup/PasswordStrengthIndicatorSpotlight', () => ({
    usePasswordStrengthIndicatorSpotlight: () => ({ supported: false, spotlight: false }),
}));

const DEFAULT_EMAIL = 'prefilled-user@example.test';
const OTHER_EMAIL = 'other-user@example.test';
const USERNAME = 'fast-typist';
const USERNAME_DOMAIN = 'proton.me';
const ASYNC_VALIDATOR_DEBOUNCE_MS = 300;

const EmailInput = () => {
    const { state, onValue } = useAccountFormDataContext();
    return (
        <input
            data-testid="email"
            value={state.email}
            onChange={(event) => onValue.onEmailValue(event.target.value, state.domains)}
        />
    );
};

const UsernameInput = () => {
    const { state, onValue } = useAccountFormDataContext();
    return (
        <input
            data-testid="username"
            value={state.username}
            onChange={(event) => onValue.onUsernameValue(event.target.value, USERNAME_DOMAIN)}
        />
    );
};

const getUsernameProvider = (domainsLoaded: boolean) => (
    <AccountFormDataContextProvider
        availableSignupTypes={new Set([SignupType.Proton])}
        domains={[USERNAME_DOMAIN]}
        domainsLoaded={domainsLoaded}
    >
        <UsernameInput />
    </AccountFormDataContextProvider>
);

const getProvider = (domainsLoaded: boolean) => (
    <AccountFormDataContextProvider
        availableSignupTypes={new Set([SignupType.External])}
        domains={['proton.me', 'protonmail.com']}
        domainsLoaded={domainsLoaded}
        defaultEmail={DEFAULT_EMAIL}
    >
        <EmailInput />
    </AccountFormDataContextProvider>
);

const flushAsyncValidator = () => act(async () => jest.advanceTimersByTime(ASYNC_VALIDATOR_DEBOUNCE_MS));

const setup = () => {
    jest.useFakeTimers();
    jest.mocked(useSilentApi).mockReturnValue(jest.fn());
    const mockValidateEmail = jest.mocked(validateEmailAvailability);
    mockValidateEmail.mockClear();
    mockValidateEmail.mockResolvedValue(defaultAsyncValidationState);

    const { rerender } = render(getProvider(false));

    return { mockValidateEmail, loadDomains: () => rerender(getProvider(true)) };
};

describe('AccountFormDataContextProvider', () => {
    it('shows the default email but defers its availability check until the signup domains have loaded', async () => {
        const { mockValidateEmail, loadDomains } = setup();

        await flushAsyncValidator();
        expect(screen.getByTestId('email')).toHaveValue(DEFAULT_EMAIL);
        expect(mockValidateEmail).not.toHaveBeenCalled();

        loadDomains();
        await flushAsyncValidator();

        expect(mockValidateEmail).toHaveBeenCalledTimes(1);
        expect(mockValidateEmail.mock.calls[0][0]).toBe(DEFAULT_EMAIL);
    });

    it('does not check an email that got superseded while it was waiting for the signup domains', async () => {
        const { mockValidateEmail, loadDomains } = setup();

        await flushAsyncValidator();
        expect(mockValidateEmail).not.toHaveBeenCalled();

        // The user replaces the default email before the domains arrive
        fireEvent.change(screen.getByTestId('email'), { target: { value: OTHER_EMAIL } });
        await flushAsyncValidator();

        loadDomains();
        await flushAsyncValidator();

        expect(mockValidateEmail).toHaveBeenCalledTimes(1);
        expect(mockValidateEmail.mock.calls[0][0]).toBe(OTHER_EMAIL);
    });

    it('defers the username availability check until the signup domains have loaded', async () => {
        jest.useFakeTimers();
        jest.mocked(useSilentApi).mockReturnValue(jest.fn());
        const mockValidateUsername = jest.mocked(validateUsernameAvailability);
        mockValidateUsername.mockClear();
        mockValidateUsername.mockResolvedValue(defaultAsyncValidationState);
        const { rerender } = render(getUsernameProvider(false));

        // The user types the username before the domains arrive
        fireEvent.change(screen.getByTestId('username'), { target: { value: USERNAME } });
        await flushAsyncValidator();
        expect(mockValidateUsername).not.toHaveBeenCalled();

        rerender(getUsernameProvider(true));
        await flushAsyncValidator();

        expect(mockValidateUsername).toHaveBeenCalledTimes(1);
        expect(mockValidateUsername.mock.calls[0][0]).toBe(`${USERNAME}@${USERNAME_DOMAIN}`);
    });
});
