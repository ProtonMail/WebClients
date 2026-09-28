import type { ReactNode } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGetPaymentsInit } from '@proton/account/paymentsInit/hooks';
import { InvoiceState } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';

import type { ModalProps } from '../../components/modalTwo/Modal';
import { renderWithProviders } from '../../testing/renderWithProviders';
import PayInvoiceModal, { type Props } from './PayInvoiceModal';

const getPaymentsInit = jest.fn().mockResolvedValue({
    hasPostedInvoices: false,
    postedInvoices: [],
});

jest.mock('@proton/account/paymentsInit/hooks', () => ({
    useGetPaymentsInit: jest.fn(),
}));

const payInvoice = jest.fn().mockResolvedValue(undefined);

jest.mock('@proton/payments-ui/client-extensions/usePaymentFacade', () => ({
    usePaymentFacade: ({
        onChargeable,
    }: {
        onChargeable: (operations: { payInvoice: jest.Mock }) => Promise<void>;
    }) => ({
        chargebeeCard: {
            processPaymentToken: jest.fn(() =>
                onChargeable({
                    payInvoice,
                })
            ),
        },
        selectedProcessor: undefined,
        selectedMethodValue: undefined,
        methods: { loading: false },
        chargebeePaypal: {},
        chargebeeIdeal: {},
        iframeHandles: {},
    }),
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));

jest.mock('../../hooks/useApiResult', () => ({
    __esModule: true,
    default: () => ({
        result: { AmountDue: 0, Amount: 0, Currency: 'EUR', Credit: 0, Code: 1000 },
        loading: false,
    }),
}));

const call = jest.fn().mockResolvedValue(undefined);

jest.mock('../../hooks/useEventManager', () => ({
    __esModule: true,
    default: () => ({ call }),
}));

jest.mock('@proton/atoms/Portal/Portal', () => ({
    Portal: ({ children }: { children: ReactNode }) => children,
}));

const baseInvoice: Invoice = {
    ID: 'invoice-1',
    Type: 1,
    State: InvoiceState.Posted,
    Currency: 'EUR',
    AmountDue: 0,
    AmountCharged: 0,
    CreateTime: 0,
    ModifyTime: 0,
    AttemptTime: 0,
    Attempts: 0,
    IsExternal: false,
};

describe('PayInvoiceModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useGetPaymentsInit as jest.Mock).mockReturnValue(getPaymentsInit);
    });

    it('should refresh payments init after paying an invoice', async () => {
        const fetchInvoices = jest.fn().mockResolvedValue(undefined);

        const props: Props & Pick<ModalProps, 'open'> = {
            invoice: baseInvoice,
            fetchInvoices,
            app: APPS.PROTONMAIL,
            open: true,
        };

        renderWithProviders(<PayInvoiceModal {...props} />);

        await userEvent.click(screen.getByTestId('pay-invoice-button'));

        await waitFor(() => {
            expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
            expect(call).toHaveBeenCalled();
            expect(fetchInvoices).toHaveBeenCalled();
            expect(getPaymentsInit).toHaveBeenCalledWith({ cache: CacheType.None });
        });
    });
});
