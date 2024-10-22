import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PLANS } from '@proton/payments';
import { apiMock } from '@proton/testing';
import { buildUser } from '@proton/testing/builders';

import { useSepaDirectDebit } from '../react-extensions/useSepaDirectDebit';
import { ChargebeeIframe } from './ChargebeeIframe';
import { SepaDirectDebit } from './SepaDirectDebit';

// Mock ChargebeeIframe component
jest.mock('./ChargebeeIframe', () => ({
    ChargebeeIframe: jest.fn(() => null),
}));

// Mock useFormErrors hook
const mockValidator = jest.fn();
const mockOnFormSubmit = jest.fn();
jest.mock('../../components/v2/useFormErrors', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        validator: mockValidator,
        onFormSubmit: mockOnFormSubmit,
    })),
}));

const TestComponent = () => {
    const directDebit = useSepaDirectDebit(
        {
            amountAndCurrency: {
                Amount: 999,
                Currency: 'EUR',
            },
            onChargeable: jest.fn(),
            selectedPlanName: PLANS.VPN2024,
            user: buildUser(),
            onBeforeSepaPayment: jest.fn(),
        },
        {
            api: apiMock,
            events: {
                onPaypalAuthorized: jest.fn(),
                onPaypalFailure: jest.fn(),
                onPaypalClicked: jest.fn(),
                onPaypalCancelled: jest.fn(),
                onThreeDsChallenge: jest.fn(),
                onThreeDsSuccess: jest.fn(),
                onThreeDsFailure: jest.fn(),
                onCardVeririfcation3dsChallenge: jest.fn(),
                onCardVeririfcationSuccess: jest.fn(),
                onCardVeririfcationFailure: jest.fn(),
                onUnhandledError: jest.fn(),
            },
            handles: {
                submitDirectDebit: jest.fn(),
            } as any,
            forceEnableChargebee: () => true,
            verifyPayment: jest.fn(),
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mockOnFormSubmit();
    };

    return (
        <form onSubmit={handleSubmit}>
            <SepaDirectDebit
                directDebit={directDebit}
                formErrors={{ validator: mockValidator, onFormSubmit: mockOnFormSubmit, reset: jest.fn() }}
                iframeHandles={{} as any}
            />
            <button type="submit">Submit</button>
        </form>
    );
};

describe('SepaDirectDebit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders SepaDirectDebit component', () => {
        render(<TestComponent />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
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

        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

        const firstNameInput = screen.getByLabelText('First name');
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

        const lastNameInput = screen.getByLabelText('Last name');
        fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'DE89370400440532013000' } });

        // We can't directly check if the hook methods were called because we're using the real hook.
        // Instead, we can check if the input values have changed.
        expect(emailInput).toHaveValue('newemail@example.com');
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
        expect(ChargebeeIframe).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'direct-debit',
            }),
            expect.anything()
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

        render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'INVALID_IBAN' } });

        // Submit the form
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText('Invalid IBAN')).toBeInTheDocument();
        });
    });

    it('shows error for missing address when required', async () => {
        mockValidator.mockImplementation(
            (validations: string[]) => validations.find((validation) => !!validation) || ''
        );

        render(<TestComponent />);

        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'GB82WEST12345698765432' } });

        await waitFor(() => {
            expect(screen.getByLabelText('Address')).toBeInTheDocument();
        });

        // Submit the form without filling the address
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            // Use data-testid to find the specific error message for the address field
            const addressErrorMessage = screen.getByTestId('error-sepa-address');
            expect(addressErrorMessage).toHaveTextContent('This field is required');
        });
    });
});
