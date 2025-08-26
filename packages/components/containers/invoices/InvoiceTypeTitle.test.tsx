import { render, screen } from '@testing-library/react';

import { type Invoice, InvoiceState, InvoiceType } from '@proton/payments';

import InvoiceTypeTitle from './InvoiceTypeTitle';

it('should render', () => {
    const invoice: Invoice = {
        ID: '1',
        Type: InvoiceType.Subscription,
        State: InvoiceState.Paid,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    const { container } = render(<InvoiceTypeTitle invoice={invoice} />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should return Currency Conversion type', () => {
    const invoice: Invoice = {
        ID: '1',
        Type: InvoiceType.CurrencyConversion,
        State: InvoiceState.Paid,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceTypeTitle invoice={invoice} />);
    expect(screen.getByText('Currency conversion')).toBeInTheDocument();
});

it('should return "Credit" type', () => {
    const regularInvoiceId = '1';

    const invoice: Invoice = {
        ID: regularInvoiceId,
        Type: InvoiceType.Credit,
        State: InvoiceState.Paid,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceTypeTitle invoice={invoice} />);
    expect(screen.getByText('Credit')).toBeInTheDocument();
    expect(screen.queryByText('Credit note')).not.toBeInTheDocument();
});

it('should return "Credit note" type', () => {
    const creditNoteId = 'CN-1';

    const invoice: Invoice = {
        ID: creditNoteId,
        Type: InvoiceType.Credit,
        State: InvoiceState.Paid,
        Currency: 'EUR',
        AmountDue: 0,
        AmountCharged: 999,
        CreateTime: 1707350400,
        ModifyTime: 1707417619,
        AttemptTime: 0,
        Attempts: 0,
        IsExternal: false,
    };

    render(<InvoiceTypeTitle invoice={invoice} />);
    expect(screen.getByText('Credit note')).toBeInTheDocument();
    expect(screen.queryByText('Credit')).not.toBeInTheDocument();
});
