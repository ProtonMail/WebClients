import type { PaymentsVersion } from '@proton/payments/core/api/api';
import type { Invoice } from '@proton/payments/core/interface';

export function getInvoicePaymentsVersion(invoice?: Invoice): PaymentsVersion {
    if (!invoice) {
        return 'v4';
    }

    return invoice.IsExternal ? 'v5' : 'v4';
}

export function getInvoicesPathname() {
    return '/dashboard#invoices';
}
