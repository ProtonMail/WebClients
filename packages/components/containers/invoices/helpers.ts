import { PaymentsVersion } from '@proton/shared/lib/api/payments';

import { Invoice } from './interface';

export function getInvoicePaymentsVersion(invoice?: Invoice): PaymentsVersion {
    if (!invoice) {
        return 'v4';
    }

    return invoice.isExternal ? 'v5' : 'v4';
}
