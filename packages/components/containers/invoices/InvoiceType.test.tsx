import { render, screen } from '@testing-library/react';

import { INVOICE_STATE, INVOICE_TYPE, type Invoice } from '@proton/payments';

import InvoiceType from './InvoiceType';

it('should render', () => {
    const invoice: Invoice = {
        ID: '1',
        Type: INVOICE_TYPE.SUBSCRIPTION,
        State: INVOICE_STATE.PAID,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    const { container } = render(<InvoiceType invoice={invoice} />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should return Currency Conversion type', () => {
    const invoice: Invoice = {
        ID: '1',
        Type: INVOICE_TYPE.CURRENCY_CONVERSION,
        State: INVOICE_STATE.PAID,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceType invoice={invoice} />);
    expect(screen.getByText('Currency conversion')).toBeInTheDocument();
});

it('should return "Credit" type', () => {
    const regularInvoiceId = '1';

    const invoice: Invoice = {
        ID: regularInvoiceId,
        Type: INVOICE_TYPE.CREDIT,
        State: INVOICE_STATE.PAID,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceType invoice={invoice} />);
    expect(screen.getByText('Credit')).toBeInTheDocument();
    expect(screen.queryByText('Credit note')).not.toBeInTheDocument();
});

it('should return "Credit note" type', () => {
    const creditNoteId = 'CN-1';

    const invoice: Invoice = {
        ID: creditNoteId,
        Type: INVOICE_TYPE.CREDIT,
        State: INVOICE_STATE.PAID,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceType invoice={invoice} />);
    expect(screen.getByText('Credit note')).toBeInTheDocument();
    expect(screen.queryByText('Credit')).not.toBeInTheDocument();
});
