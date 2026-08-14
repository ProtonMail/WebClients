import { act, fireEvent, render, screen } from '@testing-library/react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';

import { SignupType } from '../../../signup/interfaces';
import { AccountFormDataContextProvider, useAccountFormDataContext } from './AccountFormDataContext';
import { defaultAsyncValidationState } from './asyncValidator/createAsyncValidator';
import { validateEmailAvailability } from './asyncValidator/validateEmail';

jest.mock('@proton/components/hooks/useSilentApi');
jest.mock('./asyncValidator/validateEmail');
jest.mock('../../../signup/PasswordStrengthIndicatorSpotlight', () => ({
    usePasswordStrengthIndicatorSpotlight: () => ({ supported: false, spotlight: false }),
}));

const DEFAULT_EMAIL = 'prefilled-user@example.test';
const OTHER_EMAIL = 'other-user@example.test';
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
});
