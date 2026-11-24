import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import type { PaymentsContextOptimisticType } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import noop from '@proton/utils/noop';

import PassSignupPage from './PassSignup';

// Like the real form, which swallows what its submit rejects with
vi.mock('./steps/AccountDetailsStep', () => ({
    AccountDetailsStep: ({ onContinue }: { onContinue: (data: { email: string }) => Promise<void> }) => (
        <button onClick={() => onContinue({ email: 'user@example.com' }).catch(noop)}>create account</button>
    ),
}));
vi.mock('./steps/RecoveryKitStep', () => ({
    RecoveryKitStep: ({ onContinue }: { onContinue: () => Promise<void> }) => (
        <button onClick={() => onContinue()}>continue</button>
    ),
}));
vi.mock('./steps/UpgradePlanStep', () => ({ UpgradePlanStep: () => <div>upgrade plan</div> }));
vi.mock('./steps/InstallExtensionStep', () => ({ InstallExtensionStep: () => <div>install extension</div> }));

const signup = {
    createUser: vi.fn(async () => {}),
    setupUser: vi.fn(async () => {}),
};

vi.mock('../../context/SignupContext', () => ({
    SignupContextProvider: ({ children }: { children: ReactNode }) => children,
    useSignup: () => signup,
}));

let initializationStatus: PaymentsContextOptimisticType['initializationStatus'];

vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => ({
        initializationStatus,
        selectedPlan: { currency: 'CHF' },
        checkMultiplePlans: async () => [],
    }),
}));

const mockCreateNotification = vi.fn();
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const render = () =>
    renderWithProviders(<PassSignupPage onStartAuth={async () => {}} handleLogin={vi.fn()} loginUrl="/login" />);

describe('Pass signup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        initializationStatus = { triggered: true, pricingInitialized: true };
    });

    it('shows why the account could not be set up, and lets the user submit it again', async () => {
        signup.setupUser.mockRejectedValueOnce(new Error('Setup failed'));
        render();

        await userEvent.click(screen.getByText('create account'));

        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error', text: 'Setup failed' })
        );
        expect(screen.getByText('create account')).toBeInTheDocument();
    });

    it('goes on without the upsell when the payments could not load, as it could not be paid', async () => {
        initializationStatus = {
            triggered: true,
            pricingInitialized: false,
            error: new Error('Plans failed'),
        };
        render();

        await userEvent.click(screen.getByText('create account'));
        await userEvent.click(await screen.findByText('continue'));

        expect(screen.getByText('install extension')).toBeInTheDocument();
        expect(screen.queryByText('upgrade plan')).not.toBeInTheDocument();
    });
});
