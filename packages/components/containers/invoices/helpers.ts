import type { PaymentsVersion } from '@proton/shared/lib/api/payments';

import type { Invoice } from './interface';

export function getInvoicePaymentsVersion(invoice?: Invoice): PaymentsVersion {
    if (!invoice) {
        return 'v4';
    }

    return invoice.IsExternal ? 'v5' : 'v4';
}
