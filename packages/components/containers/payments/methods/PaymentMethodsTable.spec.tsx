import { render, screen } from '@testing-library/react';

import { formattedSavedSepaDetails } from '@proton/components/payments/client-extensions/useMethods';
import type { PayPalDetails, PaymentMethodSepa, SavedCardDetails, SavedPaymentMethod } from '@proton/payments';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments';

import TableBody from '../../../components/table/TableBody';
import TableRow from '../../../components/table/TableRow';
import PaymentMethodsTable from './PaymentMethodsTable';

jest.mock('../../../components/table/TableRow', () => jest.fn());
jest.mock('../../../components/table/TableBody');
jest.mock('./PaymentMethodActions', () => jest.fn().mockReturnValue(null));

describe('PaymentMethodsTable', () => {
    it('should render message that user has no payment methods', () => {
        const { container } = render(<PaymentMethodsTable loading={false} methods={[]} />);

        expect(container).toHaveTextContent('You have no saved payment methods.');
    });

    it('should render <TableBody> with loading flag', () => {
        const TableBodyMock: jest.Mock = TableBody as any;
        TableBodyMock.mockReset();
        TableBodyMock.mockReturnValue(<span>Table Body</span>);

        const { container } = render(<PaymentMethodsTable loading={true} methods={[]} />);

        expect(TableBodyMock).toHaveBeenCalled();
        expect(TableBodyMock.mock.calls[0][0].loading).toEqual(true);
        expect(container).not.toHaveTextContent('You have no saved payment methods.');
        expect(container).toHaveTextContent('Table Body');
    });

    it('should render Card method', () => {
        const Details: SavedCardDetails = {
            Name: 'John Smith',
            ExpMonth: '01',
            ExpYear: '2034',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        };

        const cardPaymentMethod: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details,
            Order: 1,
            ID: 'id123',
            Autopay: Autopay.ENABLE,
        };

        const TableBodyMock: jest.Mock = TableBody as any;
        TableBodyMock.mockReset();
        TableBodyMock.mockImplementation(({ children }) => children);

        const TableRowMock: jest.Mock = TableRow as any;
        TableRowMock.mockReset();
        TableRowMock.mockImplementation(({ cells }) => (
            <>
                <span>Table Row</span>
                <div>{cells}</div>
            </>
        ));

        const { container } = render(<PaymentMethodsTable methods={[cardPaymentMethod]} loading={false} />);

        expect(container).toHaveTextContent(Details.Brand);
        expect(container).toHaveTextContent(Details.Last4);
    });

    it('should render Paypal method', () => {
        const Details: PayPalDetails & { Payer: string } = {
            BillingAgreementID: 'agreement-id-123',
            PayerID: 'payer-id-123',
            Payer: 'John Smith',
        };

        const paypalMethod: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.PAYPAL,
            Details,
            Order: 1,
            ID: 'id123',
        };

        const TableBodyMock: jest.Mock = TableBody as any;
        TableBodyMock.mockReset();
        TableBodyMock.mockImplementation(({ children }) => children);

        const TableRowMock: jest.Mock = TableRow as any;
        TableRowMock.mockReset();
        TableRowMock.mockImplementation(({ cells }) => (
            <>
                <span>Table Row</span>
                <div>{cells}</div>
            </>
        ));

        const { container } = render(<PaymentMethodsTable methods={[paypalMethod]} loading={false} />);

        expect(container).toHaveTextContent('PayPal');
        expect(container).toHaveTextContent('John Smith');
    });

    it('should render SEPA method', () => {
        const sepaDetails = {
            AccountName: 'John Doe',
            Country: 'DE',
            Last4: '1234',
        };

        const sepaMethod: PaymentMethodSepa = {
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            Details: sepaDetails,
            Order: 1,
            ID: 'id-sepa',
            Autopay: Autopay.ENABLE,
        };

        render(<PaymentMethodsTable methods={[sepaMethod]} loading={false} />);

        expect(screen.getByTestId('sepa-payment-method')).toHaveTextContent('SEPA Direct Debit');

        const sepaDetailsElement = screen.getByTestId('sepa-details');
        expect(sepaDetailsElement).toHaveTextContent(/IBAN DE .* 1234/);
        expect(sepaDetailsElement.textContent).toMatch(formattedSavedSepaDetails(sepaMethod));
    });

    it('should display multiple payment methods', () => {
        const Details1: SavedCardDetails = {
            Name: 'John Smith',
            ExpMonth: '01',
            ExpYear: '2034',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        };

        const cardPaymentMethod1: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: Details1,
            Order: 1,
            ID: 'id-visa',
            Autopay: Autopay.ENABLE,
        };

        const Details2: SavedCardDetails = {
            Name: 'John Smith',
            ExpMonth: '01',
            ExpYear: '2038',
            ZIP: '12345',
            Country: 'US',
            Last4: '4444',
            Brand: 'Mastercard',
        };

        const cardPaymentMethod2: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: Details2,
            Order: 2,
            ID: 'id-mastercard',
            Autopay: Autopay.ENABLE,
        };

        const paypalMethod: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.PAYPAL,
            Details: {
                BillingAgreementID: 'agreement-id-123',
                PayerID: 'payer-id-123',
                Payer: 'John Smith PayPal',
            } as any,
            Order: 0,
            ID: 'id-paypal',
        };

        const TableBodyMock: jest.Mock = TableBody as any;
        TableBodyMock.mockReset();
        TableBodyMock.mockImplementation(({ children }) => children);

        const TableRowMock: jest.Mock = TableRow as any;
        TableRowMock.mockReset();
        TableRowMock.mockImplementation(({ cells }) => (
            <>
                <span>Table Row</span>
                <div>{cells}</div>
            </>
        ));

        const { container } = render(
            <PaymentMethodsTable methods={[cardPaymentMethod1, cardPaymentMethod2, paypalMethod]} loading={false} />
        );

        expect(container).toHaveTextContent('John Smith PayPal');
        expect(container).toHaveTextContent('Visa');
        expect(container).toHaveTextContent('Mastercard');

        // sorted by Order
        expect(TableBodyMock.mock.calls[0][0].children.map((it: any) => it.key)).toEqual([
            'id-paypal',
            'id-visa',
            'id-mastercard',
        ]);
    });

    it('should display multiple payment methods including SEPA', () => {
        const Details1: SavedCardDetails = {
            Name: 'John Smith',
            ExpMonth: '01',
            ExpYear: '2034',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        };

        const cardPaymentMethod1: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: Details1,
            Order: 1,
            ID: 'id-visa',
            Autopay: Autopay.ENABLE,
        };

        const Details2: SavedCardDetails = {
            Name: 'John Smith',
            ExpMonth: '01',
            ExpYear: '2038',
            ZIP: '12345',
            Country: 'US',
            Last4: '4444',
            Brand: 'Mastercard',
        };

        const cardPaymentMethod2: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: Details2,
            Order: 2,
            ID: 'id-mastercard',
            Autopay: Autopay.ENABLE,
        };

        const paypalMethod: SavedPaymentMethod = {
            Type: PAYMENT_METHOD_TYPES.PAYPAL,
            Details: {
                BillingAgreementID: 'agreement-id-123',
                PayerID: 'payer-id-123',
                Payer: 'John Smith PayPal',
            } as any,
            Order: 0,
            ID: 'id-paypal',
        };

        const sepaMethod: PaymentMethodSepa = {
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            Details: {
                AccountName: 'John Doe',
                Country: 'DE',
                Last4: '5678',
            },
            Order: 3,
            ID: 'id-sepa',
            Autopay: Autopay.ENABLE,
        };

        const TableBodyMock: jest.Mock = TableBody as any;
        TableBodyMock.mockReset();
        TableBodyMock.mockImplementation(({ children }) => children);

        const TableRowMock: jest.Mock = TableRow as any;
        TableRowMock.mockReset();
        TableRowMock.mockImplementation(({ cells }) => (
            <>
                <span>Table Row</span>
                <div>{cells}</div>
            </>
        ));

        render(
            <PaymentMethodsTable
                methods={[cardPaymentMethod1, cardPaymentMethod2, paypalMethod, sepaMethod]}
                loading={false}
            />
        );

        expect(screen.getByText('John Smith PayPal')).toBeInTheDocument();
        // check that there are two elements card-details: one visa and one mastercard
        const cardDetails = screen.getAllByTestId('card-details');
        expect(cardDetails).toHaveLength(2);
        expect(cardDetails[0]).toHaveTextContent('Visa');
        expect(cardDetails[1]).toHaveTextContent('Mastercard');
        expect(screen.getByTestId('sepa-payment-method')).toHaveTextContent('SEPA Direct Debit');
        const sepaDetailsElement = screen.getByTestId('sepa-details');
        expect(sepaDetailsElement).toHaveTextContent(/IBAN DE .* 5678/);
        expect(sepaDetailsElement.textContent).toMatch(formattedSavedSepaDetails(sepaMethod));
    });
});
