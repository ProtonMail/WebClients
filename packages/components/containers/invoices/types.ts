import type { usePaginationAsync } from '@proton/components/components/pagination';
import type { PaymentsVersion } from '@proton/payments';

export type DocumentHook = ReturnType<typeof usePaginationAsync> & {
    total: number;
    loading: boolean;
    request: (paymentsVersion?: PaymentsVersion) => Promise<any>;
    error: Error | undefined;
    type: 'invoices' | 'transactions';
};
