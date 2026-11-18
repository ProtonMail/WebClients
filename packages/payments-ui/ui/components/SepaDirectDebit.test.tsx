import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useSepaDirectDebit } from '@proton/payments-hooks/react-extensions/useSepaDirectDebit';
import { PLANS } from '@proton/payments/core/constants';
import { apiMock } from '@proton/test-api/vitest/api';

import { ChargebeeIframe } from './ChargebeeIframe';
import { SepaDirectDebit } from './SepaDirectDebit';

// Mock ChargebeeIframe component
vi.mock('@proton/payments-ui/ui/components/ChargebeeIframe', () => ({
    ChargebeeIframe: vi.fn(() => null),
}));

// Mock useFormErrors hook
const mockValidator = vi.fn();
const mockOnFormSubmit = vi.fn();

const TestComponent = () => {
    const directDebit = useSepaDirectDebit(
        {
            amountAndCurrency: {
                Amount: 999,
                Currency: 'EUR',
            },
            onChargeable: vi.fn(),
            selectedPlanName: PLANS.VPN2024,
            onBeforeSepaPayment: vi.fn(),
            onValidationFailed: vi.fn(),
        },
        {
            api: apiMock,
            events: {
                onPaypalAuthorized: vi.fn(),
                onPaypalFailure: vi.fn(),
                onPaypalClicked: vi.fn(),
                onPaypalCancelled: vi.fn(),
                onThreeDsChallenge: vi.fn(),
                onThreeDsSuccess: vi.fn(),
                onThreeDsFailure: vi.fn(),
                onCardVeririfcationSuccess: vi.fn(),
                onCardVeririfcationFailure: vi.fn(),
                onUnhandledError: vi.fn(),
                onApplePayAuthorized: vi.fn(),
                onApplePayFailure: vi.fn(),
                onApplePayClicked: vi.fn(),
                onApplePayCancelled: vi.fn(),
                onGooglePayAuthorized: vi.fn(),
                onGooglePayFailure: vi.fn(),
                onGooglePayClicked: vi.fn(),
                onGooglePayCancelled: vi.fn(),
                onIdealAuthorized: vi.fn(),
                onIdealFailure: vi.fn(),
                onIdealClicked: vi.fn(),
                onIdealCancelled: vi.fn(),
            },
            handles: {
                submitDirectDebit: vi.fn(),
            } as any,
            verifyPayment: vi.fn(),
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await directDebit.fetchPaymentToken();
        mockOnFormSubmit();
    };

    return (
        <form onSubmit={handleSubmit}>
            <SepaDirectDebit directDebit={directDebit} iframeHandles={{} as any} />
            <button type="submit">Submit</button>
        </form>
    );
};

describe('SepaDirectDebit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders SepaDirectDebit component', () => {
        render(<TestComponent />);
        expect(screen.getByLabelText('First name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last name')).toBeInTheDocument();
        expect(screen.getByLabelText('IBAN')).toBeInTheDocument();
    });

    it('switches between individual and company name', async () => {
        render(<TestComponent />);

        expect(screen.getByLabelText('First name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last name')).toBeInTheDocument();
        expect(screen.queryByLabelText('Company name')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Use company name'));

        await waitFor(() => {
            expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
        });

        expect(screen.queryByLabelText('Last name')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    });

    it('handles input changes', () => {
        render(<TestComponent />);

        const firstNameInput = screen.getByLabelText('First name');
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

        const lastNameInput = screen.getByLabelText('Last name');
        fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'DE89370400440532013000' } });

        // We can't directly check if the hook methods were called because we're using the real hook.
        // Instead, we can check if the input values have changed.
        expect(firstNameInput).toHaveValue('Jane');
        expect(lastNameInput).toHaveValue('Smith');
        expect(ibanInput).toHaveValue('DE89370400440532013000');
    });

    it('displays country and address fields when required', async () => {
        render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'GB82WEST12345698765432' } }); // UK IBAN which requires address

        await waitFor(() => {
            expect(screen.getByLabelText('Country')).toBeInTheDocument();
        });
        expect(screen.getByLabelText('Address')).toBeInTheDocument();
    });

    it('renders ChargebeeIframe component', () => {
        render(<TestComponent />);
        expect(vi.mocked(ChargebeeIframe).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({
                type: 'direct-debit',
            })
        );
    });

    it('hides address fields when IBAN changes from GB to DE', async () => {
        render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');

        // Enter GB IBAN
        fireEvent.change(ibanInput, { target: { value: 'GB82WEST12345698765432' } });

        await waitFor(() => {
            expect(screen.getByLabelText('Country')).toBeInTheDocument();
        });
        expect(screen.getByLabelText('Address')).toBeInTheDocument();

        // Change to DE IBAN
        fireEvent.change(ibanInput, { target: { value: 'DE89370400440532013000' } });

        await waitFor(() => {
            expect(screen.queryByLabelText('Country')).not.toBeInTheDocument();
        });
        expect(screen.queryByLabelText('Address')).not.toBeInTheDocument();
    });

    it('shows error for invalid IBAN', async () => {
        mockValidator.mockImplementation(
            (validations: string[]) => validations.find((validation) => !!validation) || ''
        );

        const { rerender } = render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'INVALID_IBAN' } });

        // Submit the form
        fireEvent.click(screen.getByText('Submit'));

        rerender(<TestComponent />);

        await waitFor(() => {
            expect(screen.getByText('Invalid IBAN')).toBeInTheDocument();
        });
    });

    it('shows error for missing address when required', async () => {
        mockValidator.mockImplementation(
            (validations: string[]) => validations.find((validation) => !!validation) || ''
        );

        const { rerender } = render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'GB82WEST12345698765432' } });

        await waitFor(() => {
            expect(screen.getByLabelText('Address')).toBeInTheDocument();
        });

        // Submit the form without filling the address
        fireEvent.click(screen.getByText('Submit'));

        rerender(<TestComponent />);

        await waitFor(() => {
            // Use data-testid to find the specific error message for the address field
            const addressErrorMessage = screen.getByTestId('error-sepa-address');
            expect(addressErrorMessage).toHaveTextContent('This field is required');
        });
    });
});
