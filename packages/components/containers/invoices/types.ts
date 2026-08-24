import type { PaymentsVersion } from '@proton/payments/core/api/api';

import type { usePaginationAsync } from '../../components/pagination/index';

export type DocumentHook = ReturnType<typeof usePaginationAsync> & {
    total: number;
    loading: boolean;
    request: (paymentsVersion?: PaymentsVersion) => Promise<any>;
    error: Error | undefined;
    type: 'invoices' | 'transactions';
};
