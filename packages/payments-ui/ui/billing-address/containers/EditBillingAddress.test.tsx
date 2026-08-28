import { fireEvent, screen, waitFor } from '@testing-library/react';

import { changeBillingAddress } from '@proton/account';
import { useNotifications } from '@proton/app-context/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import type { FullBillingAddress } from '@proton/payments/core/billing-address/billing-address';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { EditBillingAddressModal } from './EditBillingAddress';

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: jest.fn(),
}));

jest.mock('@proton/account', () => ({
    ...jest.requireActual('@proton/account'),
    changeBillingAddress: jest.fn((payload) => ({ type: 'changeBillingAddress', payload })),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockUsePaymentsApi = usePaymentsApi as jest.MockedFunction<typeof usePaymentsApi>;

function clickSave() {
    fireEvent.click(screen.getByRole('button', { name: 'Save', hidden: true }));
}

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

function renderEditBillingAddressModal({
    initialFullBillingAddress = createInitialBillingAddress(),
    paymentsApi,
}: {
    initialFullBillingAddress?: FullBillingAddress;
    paymentsApi?: PaymentsApi;
} = {}) {
    const updateFullBillingAddress = jest.fn().mockResolvedValue(undefined);
    const defaultPaymentsApi = {
        updateFullBillingAddress,
    } as unknown as PaymentsApi;

    mockUsePaymentsApi.mockReturnValue({
        paymentsApi: paymentsApi ?? defaultPaymentsApi,
    } as any);

    const onResolve = jest.fn();
    const onReject = jest.fn();

    renderWithProviders(
        <EditBillingAddressModal
            open
            initialFullBillingAddress={initialFullBillingAddress}
            paymentsApi={paymentsApi ?? defaultPaymentsApi}
            subscription={undefined}
            onResolve={onResolve}
            onReject={onReject}
        />
    );

    return {
        updateFullBillingAddress,
        onResolve,
        onReject,
    };
}

describe('EditBillingAddressModal', () => {
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
            renderEditBillingAddressModal();

            clickSave();

            expect(await screen.findByText('Company name or personal name is required')).toBeInTheDocument();
            expect(screen.getAllByText('This field is required').length).toBeGreaterThanOrEqual(2);
        });

        it('does not submit when extended billing details are missing', async () => {
            const { updateFullBillingAddress } = renderEditBillingAddressModal();

            clickSave();

            await screen.findByText('Company name or personal name is required');

            expect(updateFullBillingAddress).not.toHaveBeenCalled();
        });

        it('submits successfully when company, address and city are provided with a VAT number', async () => {
            const { updateFullBillingAddress, onResolve } = renderEditBillingAddressModal({
                initialFullBillingAddress: createInitialBillingAddress({
                    Company: 'Acme GmbH',
                    Address: 'Main street 12',
                    City: 'Berlin',
                }),
            });

            clickSave();

            await waitFor(() => {
                expect(updateFullBillingAddress).toHaveBeenCalledWith(
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
            expect(changeBillingAddress).toHaveBeenCalled();
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ text: 'Billing details updated' })
            );
        });
    });
});
