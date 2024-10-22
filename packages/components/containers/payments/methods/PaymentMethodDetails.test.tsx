import { render, screen } from '@testing-library/react';

import { getSepaAuthorizationText } from '@proton/components/payments/chargebee/SepaAuthorizationText';
import { PAYMENT_METHOD_TYPES, type PayPalDetails, type SavedCardDetails } from '@proton/payments';

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

    it('renders SEPA details correctly', () => {
        const mockSepaDetails = {
            AccountName: 'John Doe',
            Country: 'DE',
            Last4: '1234',
        };

        render(
            <PaymentMethodDetails type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT} details={mockSepaDetails} />
        );

        expect(screen.getByText(getSepaAuthorizationText())).toBeInTheDocument();

        // todo: other details
        // todo: PAY-2548
        // expect(screen.getByText('John Doe')).toBeInTheDocument();
        // expect(screen.getByText('•••• 1234')).toBeInTheDocument();
        // expect(screen.getByText('DE')).toBeInTheDocument();
    });

    it('renders SEPA authorization text for SEPA method', () => {
        const mockSepaDetails = {
            AccountName: 'John Doe',
            Country: 'DE',
            Last4: '1234',
        };

        render(
            <PaymentMethodDetails type={PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT} details={mockSepaDetails} />
        );

        expect(screen.getByText(/By confirming this payment, you authorize/)).toBeInTheDocument();
    });

    it('does not render SEPA authorization text for non-SEPA methods', () => {
        render(<PaymentMethodDetails type={PAYMENT_METHOD_TYPES.CARD} details={mockCardDetails} />);

        expect(screen.queryByText(/By confirming this payment, you authorize/)).not.toBeInTheDocument();
    });
});
