import type { Invoice, PaymentsVersion } from '@proton/payments';

export function getInvoicePaymentsVersion(invoice?: Invoice): PaymentsVersion {
    if (!invoice) {
        return 'v4';
    }

    return invoice.IsExternal ? 'v5' : 'v4';
}

export function getInvoicesPathname() {
    return '/dashboard#invoices';
}
