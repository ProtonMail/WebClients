import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock, MockedFunction } from 'vitest';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useRedirectToAccountApp } from '@proton/components/containers/desktop/useRedirectToAccountApp';
import useModals from '@proton/components/hooks/useModals';
import { usePaymentsApi } from '@proton/payments-hooks/react-extensions/usePaymentsApi';
import { InvoiceState } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';
import { APPS } from '@proton/shared/lib/constants';

import InvoiceActions from './InvoiceActions';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: vi.fn(),
}));

vi.mock('@proton/components/hooks/useModals', () => ({
    default: vi.fn().mockReturnValue({
        createModal: vi.fn(),
    }),
}));

vi.mock('@proton/components/containers/desktop/useRedirectToAccountApp', () => ({
    useRedirectToAccountApp: vi.fn().mockReturnValue(vi.fn().mockReturnValue(false)),
}));

// The real DropdownActions renders its overflow actions inside a Portal-backed dropdown.
// Mocking Portal to render its children inline lets us exercise the real component.
vi.mock('@proton/atoms/Portal/Portal');

const baseInvoice: Invoice = {
    ID: 'invoice-1',
    Type: 1,
    State: InvoiceState.Unpaid,
    Currency: 'EUR',
    AmountDue: 1000,
    AmountCharged: 1000,
    CreateTime: 0,
    ModifyTime: 0,
    AttemptTime: 0,
    Attempts: 0,
    IsExternal: false,
};

const openActionsDropdown = async () => {
    const toggle = screen.queryByTestId('dropdownActions:dropdown');
    if (toggle) {
        await userEvent.click(toggle);
    }
};

function renderInvoiceActions(invoice: Invoice, overrides: Partial<Parameters<typeof InvoiceActions>[0]> = {}) {
    const fetchInvoices = vi.fn();
    const onPreview = vi.fn();
    const onDownload = vi.fn();
    const onEdit = vi.fn().mockResolvedValue(undefined);

    render(
        <InvoiceActions
            invoice={invoice}
            fetchInvoices={fetchInvoices}
            onPreview={onPreview}
            onDownload={onDownload}
            onEdit={onEdit}
            app={APPS.PROTONMAIL}
            {...overrides}
        />
    );

    return { fetchInvoices, onPreview, onDownload, onEdit };
}

const mockUsePaymentsApi = usePaymentsApi as MockedFunction<typeof usePaymentsApi>;

describe('InvoiceActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useNotifications as Mock).mockReturnValue({ createNotification: vi.fn() });
        (useModals as Mock).mockReturnValue({ createModal: vi.fn() });
        (useRedirectToAccountApp as Mock).mockReturnValue(vi.fn().mockReturnValue(false));
        mockUsePaymentsApi.mockReturnValue({
            paymentsApi: {
                paymentStatus: vi.fn().mockResolvedValue({ VendorStates: { Card: true, Paypal: true } }),
            },
        } as any);
    });

    it('shows Pay, View and Download for an unpaid invoice, without Edit invoice details', async () => {
        renderInvoiceActions(baseInvoice);
        await openActionsDropdown();

        expect(screen.getByTestId('payInvoice')).toBeInTheDocument();
        expect(screen.getByTestId('viewInvoice')).toBeInTheDocument();
        expect(screen.getByTestId('downloadInvoice')).toBeInTheDocument();
        expect(screen.queryByTestId('editBillingAddress')).not.toBeInTheDocument();
    });

    it('shows Pay for a posted invoice', async () => {
        renderInvoiceActions({ ...baseInvoice, State: InvoiceState.Posted });
        await openActionsDropdown();

        expect(screen.getByTestId('payInvoice')).toBeInTheDocument();
    });

    it('does not show Pay for a paid invoice', async () => {
        renderInvoiceActions({ ...baseInvoice, State: InvoiceState.Paid });
        await openActionsDropdown();

        expect(screen.queryByTestId('payInvoice')).not.toBeInTheDocument();
        expect(screen.getByTestId('viewInvoice')).toBeInTheDocument();
        expect(screen.getByTestId('downloadInvoice')).toBeInTheDocument();
    });

    it('shows Edit invoice details for an external regular invoice', async () => {
        renderInvoiceActions({ ...baseInvoice, IsExternal: true });
        await openActionsDropdown();

        expect(screen.getByTestId('editBillingAddress')).toBeInTheDocument();
    });

    it('does not show Edit invoice details for a non-external invoice', async () => {
        renderInvoiceActions({ ...baseInvoice, IsExternal: false });
        await openActionsDropdown();

        expect(screen.queryByTestId('editBillingAddress')).not.toBeInTheDocument();
    });

    it('calls onPreview when clicking View', async () => {
        const { onPreview } = renderInvoiceActions(baseInvoice);
        await openActionsDropdown();

        await userEvent.click(screen.getByTestId('viewInvoice'));

        expect(onPreview).toHaveBeenCalledWith(baseInvoice);
    });

    it('calls onDownload when clicking Download', async () => {
        const { onDownload } = renderInvoiceActions(baseInvoice);
        await openActionsDropdown();

        await userEvent.click(screen.getByTestId('downloadInvoice'));

        expect(onDownload).toHaveBeenCalledWith(baseInvoice);
    });

    it('calls onEdit when clicking Edit invoice details', async () => {
        const { onEdit } = renderInvoiceActions({ ...baseInvoice, IsExternal: true });
        await openActionsDropdown();

        await userEvent.click(screen.getByTestId('editBillingAddress'));

        expect(onEdit).toHaveBeenCalledWith({ ...baseInvoice, IsExternal: true });
    });

    describe('Pay action', () => {
        it('opens PayInvoiceModal when payments are available', async () => {
            const createModal = vi.fn();
            (useModals as Mock).mockReturnValue({ createModal });

            renderInvoiceActions(baseInvoice);
            await openActionsDropdown();

            await userEvent.click(screen.getByTestId('payInvoice'));

            await waitFor(() => expect(createModal).toHaveBeenCalled());
        });

        it('shows an error notification and does not open the modal when no payment method is available', async () => {
            const createNotification = vi.fn();
            const createModal = vi.fn();
            (useNotifications as Mock).mockReturnValue({ createNotification });
            (useModals as Mock).mockReturnValue({ createModal });
            mockUsePaymentsApi.mockReturnValue({
                paymentsApi: {
                    paymentStatus: vi.fn().mockResolvedValue({ VendorStates: { Card: false, Paypal: false } }),
                },
            } as any);

            renderInvoiceActions(baseInvoice);
            await openActionsDropdown();

            await userEvent.click(screen.getByTestId('payInvoice'));

            await waitFor(() =>
                expect(createNotification).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'error',
                        text: 'Payments are currently not available, please try again later',
                    })
                )
            );
            expect(createModal).not.toHaveBeenCalled();
        });

        it('does not open the modal when redirected to the account app', async () => {
            const createModal = vi.fn();
            (useModals as Mock).mockReturnValue({ createModal });
            (useRedirectToAccountApp as Mock).mockReturnValue(vi.fn().mockReturnValue(true));

            renderInvoiceActions(baseInvoice);
            await openActionsDropdown();

            await userEvent.click(screen.getByTestId('payInvoice'));

            expect(mockUsePaymentsApi().paymentsApi.paymentStatus).not.toHaveBeenCalled();
            expect(createModal).not.toHaveBeenCalled();
        });
    });
});
