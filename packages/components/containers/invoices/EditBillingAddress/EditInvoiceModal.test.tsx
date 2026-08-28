import { fireEvent, screen, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { FullBillingAddress } from '@proton/payments/core/billing-address/billing-address';
import type { Invoice } from '@proton/payments/core/interface';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { usePaymentsApi } from '../../../payments/react-extensions/usePaymentsApi';
import { EditInvoiceModal } from './EditInvoiceModal';

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('../../../payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockUsePaymentsApi = usePaymentsApi as jest.MockedFunction<typeof usePaymentsApi>;

const invoice: Invoice = {
    ID: 'invoice-1',
    Type: 0,
    State: 0,
    Currency: 'EUR',
    AmountDue: 1000,
    AmountCharged: 1000,
    CreateTime: 0,
    ModifyTime: 0,
    AttemptTime: 0,
    Attempts: 0,
    IsExternal: false,
};

function createInitialBillingAddress(
    overrides: Partial<FullBillingAddress['BillingAddress']> = {}
): FullBillingAddress {
    return {
        VatId: 'DE123456788',
        BillingAddress: {
            CountryCode: 'DE',
            State: null,
            ZipCode: '10115',
            ...overrides,
        },
    };
}

function renderEditInvoiceModal({
    initialInvoiceBillingAddress = createInitialBillingAddress(),
    initialFullBillingAddress = createInitialBillingAddress(),
}: {
    initialInvoiceBillingAddress?: FullBillingAddress;
    initialFullBillingAddress?: FullBillingAddress;
} = {}) {
    const updateInvoiceBillingAddress = jest.fn().mockResolvedValue(undefined);

    mockUsePaymentsApi.mockReturnValue({
        paymentsApi: {
            updateInvoiceBillingAddress,
        },
    } as any);

    const onResolve = jest.fn();
    const onReject = jest.fn();

    renderWithProviders(
        <EditInvoiceModal
            open
            invoice={invoice}
            initialInvoiceBillingAddress={initialInvoiceBillingAddress}
            initialFullBillingAddress={initialFullBillingAddress}
            onResolve={onResolve}
            onReject={onReject}
        />
    );

    return {
        updateInvoiceBillingAddress,
        onResolve,
        onReject,
    };
}

describe('EditInvoiceModal', () => {
    let createNotification: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        createNotification = jest.fn();
        mockUseNotifications.mockReturnValue({
            createNotification,
        } as any);
    });

    describe('extended billing address validation', () => {
        it('shows validation errors when saving a VAT number without billing details', async () => {
            renderEditInvoiceModal();

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            expect(await screen.findByText('Company name or personal name is required')).toBeInTheDocument();
            expect(screen.getAllByText('This field is required').length).toBeGreaterThanOrEqual(2);
        });

        it('does not submit when extended billing details are missing', async () => {
            const { updateInvoiceBillingAddress } = renderEditInvoiceModal();

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await screen.findByText('Company name or personal name is required');

            expect(updateInvoiceBillingAddress).not.toHaveBeenCalled();
        });

        it('submits successfully when company, address and city are provided with a VAT number', async () => {
            const completeAddress = createInitialBillingAddress({
                Company: 'Acme GmbH',
                Address: 'Main street 12',
                City: 'Berlin',
            });
            const { updateInvoiceBillingAddress, onResolve } = renderEditInvoiceModal({
                initialInvoiceBillingAddress: completeAddress,
                initialFullBillingAddress: completeAddress,
            });

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(updateInvoiceBillingAddress).toHaveBeenCalledWith(
                    'invoice-1',
                    expect.objectContaining({
                        VatId: 'DE123456788',
                        BillingAddress: expect.objectContaining({
                            Company: 'Acme GmbH',
                            Address: 'Main street 12',
                            City: 'Berlin',
                        }),
                    })
                );
            });

            expect(onResolve).toHaveBeenCalled();
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ text: 'Billing details updated' })
            );
        });
    });
});
