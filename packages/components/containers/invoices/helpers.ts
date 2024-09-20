import type { Invoice } from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';

export function getInvoicePaymentsVersion(invoice?: Invoice): PaymentsVersion {
    if (!invoice) {
        return 'v4';
    }

    return invoice.IsExternal ? 'v5' : 'v4';
}
