import { render, screen } from '@testing-library/react';

import { getSepaAuthorizationText } from '@proton/components/payments/chargebee/SepaAuthorizationText';
import { PAYMENT_METHOD_TYPES, type PayPalDetails, type SavedCardDetails, type SepaDetails } from '@proton/payments';

import PaymentMethodDetails from './PaymentMethodDetails';

// Mock the getBankSvg function
jest.mock('@proton/components/payments/client-extensions/credit-card-type', () => ({
    getBankSvg: jest.fn(() => 'MockedBankSvg'),
}));

describe('PaymentMethodDetails', () => {
    const mockCardDetails: SavedCardDetails = {
        Name: 'John Doe',
        ExpMonth: '12',
        ExpYear: '2025',
        ZIP: '12345',
        Country: 'US',
        Last4: '1234',
        Brand: 'visa',
    };

    const mockPayPalDetails: PayPalDetails = {
        BillingAgreementID: 'B-1234567890',
        PayerID: 'PAYERID123',
        Payer: 'johndoe@example.com',
    };

    const mockSepaDetails: SepaDetails = {
        AccountName: 'John Doe',
        Country: 'DE',
        Last4: '1234',
    };

    it('renders card details correctly', () => {
        render(<PaymentMethodDetails type={PAYMENT_METHOD_TYPES.CARD} details={mockCardDetails} />);

        expect(screen.getByAltText('visa')).toBeInTheDocument();
        expect(screen.getByText('•••• •••• •••• 1234')).toBeInTheDocument();
        expect(screen.getByText('12/2025')).toBeInTheDocument();
    });

    it('renders PayPal details correctly', () => {
        render(<PaymentMethodDetails type={PAYMENT_METHOD_TYPES.PAYPAL} details={mockPayPalDetails} />);

        expect(screen.getByAltText('PayPal')).toBeInTheDocument();
        expect(screen.getByText('johndoe@example.com')).toBeInTheDocument();
    });

    describe('SEPA payment method', () => {
        it('renders SEPA details correctly', () => {
            render(
                <PaymentMethodDetails
                    type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT}
                    details={mockSepaDetails}
                />
            );

            // Check account holder details
            expect(screen.getByText('Account holder')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();

            // Check IBAN details
            expect(screen.getByText('IBAN')).toBeInTheDocument();
            expect(screen.getByText('DE •••• 1234')).toBeInTheDocument();

            // Check authorization text
            expect(screen.getByText(getSepaAuthorizationText())).toBeInTheDocument();
        });

        it('renders authorization text even with invalid SEPA details', () => {
            const invalidSepaDetails = {
                // Missing required fields
                AccountName: 'John Doe',
            } as any;

            render(
                <PaymentMethodDetails
                    type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT}
                    details={invalidSepaDetails}
                />
            );

            // Should still show authorization text
            expect(screen.getByText(getSepaAuthorizationText())).toBeInTheDocument();

            // Should not show the details section
            expect(screen.queryByText('Account holder')).not.toBeInTheDocument();
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        });

        it('renders authorization text even without SEPA details', () => {
            render(
                <PaymentMethodDetails
                    type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT}
                    details={undefined as any}
                />
            );

            expect(screen.getByText(getSepaAuthorizationText())).toBeInTheDocument();
        });

        it('renders with data-testid for e2e testing', () => {
            render(
                <PaymentMethodDetails
                    type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT}
                    details={mockSepaDetails}
                />
            );

            expect(screen.getByTestId('existing-sepa')).toBeInTheDocument();
        });
    });

    it('does not render SEPA authorization text for non-SEPA methods', () => {
        render(<PaymentMethodDetails type={PAYMENT_METHOD_TYPES.CARD} details={mockCardDetails} />);

        expect(screen.queryByText(/By confirming this payment, you authorize/)).not.toBeInTheDocument();
    });
});
