import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { Mock, MockedFunction } from 'vitest';

import { changeBillingAddress } from '@proton/account/paymentStatus';
import { useNotifications } from '@proton/app-context/useNotifications';
import { usePaymentsApi } from '@proton/payments-hooks/react-extensions/usePaymentsApi';
import { renderWithProviders } from '@proton/payments-hooks/testing/vitest/renderWithProviders';
import type { FullBillingAddress } from '@proton/payments/core/billing-address/billing-address';
import type { PaymentsApi } from '@proton/payments/core/interface';

import { EditBillingAddressModal } from './EditBillingAddress';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: vi.fn(),
}));

vi.mock('@proton/account/paymentStatus', async () => ({
    ...(await vi.importActual<any>('@proton/account/paymentStatus')),
    changeBillingAddress: vi.fn((payload) => ({ type: 'changeBillingAddress', payload })),
}));

const mockUseNotifications = useNotifications as MockedFunction<typeof useNotifications>;
const mockUsePaymentsApi = usePaymentsApi as MockedFunction<typeof usePaymentsApi>;

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
    const updateFullBillingAddress = vi.fn().mockResolvedValue(undefined);
    const defaultPaymentsApi = {
        updateFullBillingAddress,
    } as unknown as PaymentsApi;

    mockUsePaymentsApi.mockReturnValue({
        paymentsApi: paymentsApi ?? defaultPaymentsApi,
    } as any);

    const onResolve = vi.fn();
    const onReject = vi.fn();

    const createModal = () => (
        <EditBillingAddressModal
            open
            initialFullBillingAddress={initialFullBillingAddress}
            paymentsApi={paymentsApi ?? defaultPaymentsApi}
            subscription={undefined}
            source="invoices"
            onResolve={onResolve}
            onReject={onReject}
        />
    );

    const { rerender } = renderWithProviders(createModal());

    return {
        updateFullBillingAddress,
        onResolve,
        onReject,
        rerenderFromParent: () => rerender(createModal()),
    };
}

describe('EditBillingAddressModal', () => {
    let createNotification: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        createNotification = vi.fn();
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

    it('stores a cleared postal code as null', async () => {
        const { updateFullBillingAddress, onResolve } = renderEditBillingAddressModal({
            initialFullBillingAddress: { BillingAddress: { CountryCode: 'FR', State: null, ZipCode: '75001' } },
        });

        fireEvent.change(screen.getByTestId('billing-address-zipcode'), { target: { value: '' } });
        clickSave();

        await waitFor(() => {
            expect(updateFullBillingAddress).toHaveBeenCalledWith(
                expect.objectContaining({ BillingAddress: expect.objectContaining({ ZipCode: null }) })
            );
        });
        expect(onResolve).toHaveBeenCalledWith(
            expect.objectContaining({ BillingAddress: expect.objectContaining({ ZipCode: null }) })
        );
        expect(changeBillingAddress).toHaveBeenCalledWith(expect.objectContaining({ ZipCode: null }));
    });

    it('keeps the state list open when the modal re-renders', () => {
        const { rerenderFromParent } = renderEditBillingAddressModal({
            initialFullBillingAddress: createInitialBillingAddress({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '90001',
            }),
        });

        const stateDropdown = screen.getByTestId('tax-state-dropdown');
        fireEvent.click(stateDropdown);
        expect(stateDropdown).toHaveAttribute('aria-expanded', 'true');

        rerenderFromParent();

        expect(screen.getByTestId('tax-state-dropdown')).toBe(stateDropdown);
        expect(stateDropdown).toHaveAttribute('aria-expanded', 'true');
    });
});
