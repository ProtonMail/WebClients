import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { PLANS } from '../../../core/constants';
import type { PaymentsApi } from '../../../core/interface';
import type { TaxCountryHook } from './useTaxCountry';
import { useVatNumber } from './useVatNumber';

const mockSelectUser = jest.fn();
jest.mock('@proton/account/user', () => ({
    selectUser: (...args: any[]) => mockSelectUser(...args),
}));

const mockGetFullBillingAddress = jest.fn();
const mockDefaultPaymentsApi = {
    getFullBillingAddress: mockGetFullBillingAddress,
} as unknown as PaymentsApi;

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: () => ({ paymentsApi: mockDefaultPaymentsApi }),
}));

const mockWithLoading = jest.fn((promise: Promise<unknown>) => promise);
jest.mock('@proton/hooks/useLoading', () => {
    return {
        __esModule: true,
        default: () => [false, mockWithLoading, jest.fn()],
    };
});

const mockGetState = jest.fn();
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    useStore: () => ({ getState: mockGetState }),
}));

jest.mock('./useVatFormValidation', () => ({
    getVatFormErrors: () => ({
        hasErrors: false,
        errorMessages: { VatId: '', Company: '', FirstName: '', LastName: '', Address: '', City: '' },
    }),
}));

jest.mock('../../../core/plan/helpers', () => ({
    getIsB2BAudienceFromPlan: (plan: string | undefined) => {
        const b2bPlans = new Set([
            PLANS.MAIL_PRO,
            PLANS.MAIL_BUSINESS,
            PLANS.DRIVE_PRO,
            PLANS.DRIVE_BUSINESS,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.VPN_PRO,
            PLANS.VPN_BUSINESS,
            PLANS.PASS_PRO,
            PLANS.PASS_BUSINESS,
        ]);
        return !!plan && b2bPlans.has(plan as PLANS);
    },
}));

function buildTaxCountryStub(overrides: Partial<TaxCountryHook> = {}): TaxCountryHook {
    return {
        selectedCountryCode: 'DE',
        setSelectedCountry: jest.fn(),
        federalStateCode: null,
        setFederalStateCode: jest.fn(),
        zipCode: null,
        setZipCode: jest.fn(),
        billingAddressValid: true,
        billingAddressStatus: { valid: true },
        zipCodeBackendValid: true,
        paymentsApi: mockDefaultPaymentsApi,
        billingAddressChangedInModal: jest.fn(),
        ...overrides,
    } as TaxCountryHook;
}

function defaultProps(overrides: Record<string, any> = {}) {
    return {
        selectedPlanName: PLANS.MAIL_PRO,
        isAuthenticated: true,
        taxCountry: buildTaxCountryStub(),
        ...overrides,
    };
}

describe('useVatNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetState.mockReturnValue({});
        mockSelectUser.mockReturnValue(undefined);
        mockGetFullBillingAddress.mockResolvedValue({ VatId: 'VAT123' });
    });

    // ─── 1. Initialization and defaults ──────────────────────────────

    describe('Initialization and defaults', () => {
        it('should return empty vatNumber initially', () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            expect(result.current.vatNumber).toBe('');
        });

        it('should set enableVatNumber to true for B2B plans', () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            expect(result.current.enableVatNumber).toBe(true);
        });

        it('should set enableVatNumber to false for consumer plans', () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ selectedPlanName: PLANS.MAIL })));

            expect(result.current.enableVatNumber).toBe(false);
        });

        it('should set enableVatNumber to false when plan is undefined', () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ selectedPlanName: undefined })));

            expect(result.current.enableVatNumber).toBe(false);
        });

        it('should set renderVatNumberInput to true for B2B plan + EU country', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            expect(result.current.renderVatNumberInput).toBe(true);
        });

        it('should set renderVatNumberInput to false for non-EU/EFTA country', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'US' }),
                    })
                )
            );

            expect(result.current.renderVatNumberInput).toBe(false);
        });

        it('should set renderVatNumberInput to false for consumer plan even with EU country', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        selectedPlanName: PLANS.MAIL,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            expect(result.current.renderVatNumberInput).toBe(false);
        });

        it('should expose paymentsApi and shouldEditInModal in return value', () => {
            const customApi = { getFullBillingAddress: jest.fn() } as unknown as PaymentsApi;
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({ paymentsApi: customApi, isAuthenticated: true, selectedPlanName: PLANS.MAIL })
                )
            );

            expect(result.current.paymentsApi).toBe(customApi);
            expect(result.current.shouldEditInModal).toBe(true);
        });
    });

    // ─── 2. Fetching VAT number ──────────────────────────────────────

    describe('Fetching VAT number', () => {
        it('should fetch VAT number when authenticated with a B2B plan', async () => {
            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(mockGetFullBillingAddress).toHaveBeenCalledTimes(1);
            expect(result.current.vatNumber).toBe('VAT123');
        });

        it('should set vatNumber to empty string when VatId is null', async () => {
            mockGetFullBillingAddress.mockResolvedValue({ VatId: null });

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('');
        });

        it('should set vatNumber to empty string when VatId is undefined', async () => {
            mockGetFullBillingAddress.mockResolvedValue({});

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('');
        });

        it('should NOT fetch when isAuthenticated is false', async () => {
            renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            await act(async () => {});

            expect(mockGetFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should NOT fetch when plan is not B2B', async () => {
            renderHook(() => useVatNumber(defaultProps({ selectedPlanName: PLANS.MAIL })));

            await act(async () => {});

            expect(mockGetFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should handle API error gracefully', async () => {
            mockGetFullBillingAddress.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('');
        });
    });

    // ─── 3. isAuthenticated resolution ───────────────────────────────

    describe('isAuthenticated resolution', () => {
        it('should use isAuthenticated prop when provided', async () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: true })));

            await act(async () => {});

            expect(result.current.shouldEditInModal).toBe(true);
        });

        it('should fall back to store user when isAuthenticated prop is undefined', async () => {
            mockSelectUser.mockReturnValue({ value: { ID: 'user-1' } });

            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: undefined })));

            await act(async () => {});

            expect(result.current.shouldEditInModal).toBe(true);
            expect(mockGetState).toHaveBeenCalled();
        });

        it('should resolve to false when no prop and no user in store', () => {
            mockSelectUser.mockReturnValue(undefined);

            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ isAuthenticated: undefined, selectedPlanName: PLANS.MAIL }))
            );

            expect(result.current.shouldEditInModal).toBe(false);
        });
    });

    // ─── 4. paymentsApi resolution ───────────────────────────────────

    describe('paymentsApi resolution', () => {
        it('should use paymentsApi prop when provided', () => {
            const customApi = { getFullBillingAddress: jest.fn() } as unknown as PaymentsApi;

            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ paymentsApi: customApi, isAuthenticated: false }))
            );

            expect(result.current.paymentsApi).toBe(customApi);
        });

        it('should fall back to default paymentsApi when prop is undefined', () => {
            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ paymentsApi: undefined, isAuthenticated: false }))
            );

            expect(result.current.paymentsApi).toBe(mockDefaultPaymentsApi);
        });
    });

    // ─── 5. setVatNumber (handleVatNumberChange) ─────────────────────

    describe('setVatNumber', () => {
        it('should update vatNumber state', () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            act(() => {
                result.current.setVatNumber('NEW-VAT');
            });

            expect(result.current.vatNumber).toBe('NEW-VAT');
        });

        it('should call onVatChange callback with new value', () => {
            const onVatChange = jest.fn();
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false, onVatChange })));

            act(() => {
                result.current.setVatNumber('NEW-VAT');
            });

            expect(onVatChange).toHaveBeenCalledWith('NEW-VAT');
        });

        it('should work when onChange is not provided', () => {
            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ isAuthenticated: false, onChange: undefined }))
            );

            expect(() => {
                act(() => {
                    result.current.setVatNumber('NEW-VAT');
                });
            }).not.toThrow();

            expect(result.current.vatNumber).toBe('NEW-VAT');
        });
    });

    // ─── 6. Country/plan change effect ───────────────────────────────

    describe('Country/plan change effect', () => {
        it('should clear vatNumber when country changes to non-VAT country', () => {
            const onVatChange = jest.fn();
            const taxCountry = buildTaxCountryStub({ selectedCountryCode: 'DE' });

            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({
                    isAuthenticated: false,
                    onVatChange,
                    taxCountry,
                }),
            });

            act(() => {
                result.current.setVatNumber('VAT-123');
            });
            onVatChange.mockClear();

            const nonVatCountry = buildTaxCountryStub({ selectedCountryCode: 'US' });
            rerender(
                defaultProps({
                    isAuthenticated: false,
                    onVatChange,
                    taxCountry: nonVatCountry,
                })
            );

            expect(result.current.vatNumber).toBe('');
            expect(onVatChange).toHaveBeenCalledWith('');
        });

        it('should clear vatNumber when plan changes to non-B2B', () => {
            const onVatChange = jest.fn();

            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({ isAuthenticated: false, onVatChange }),
            });

            act(() => {
                result.current.setVatNumber('VAT-123');
            });
            onVatChange.mockClear();

            rerender(
                defaultProps({
                    selectedPlanName: PLANS.MAIL,
                    isAuthenticated: false,
                    onVatChange,
                })
            );

            expect(result.current.vatNumber).toBe('');
            expect(onVatChange).toHaveBeenCalledWith('');
        });

        it('should NOT clear vatNumber when country is in VAT list and plan is B2B', () => {
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({ isAuthenticated: false }),
            });

            act(() => {
                result.current.setVatNumber('VAT-123');
            });

            const frCountry = buildTaxCountryStub({ selectedCountryCode: 'FR' });
            rerender(defaultProps({ isAuthenticated: false, taxCountry: frCountry }));

            expect(result.current.vatNumber).toBe('VAT-123');
        });

        it('should NOT trigger when vatNumber is already empty', () => {
            const onVatChange = jest.fn();

            const { rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({ isAuthenticated: false, onVatChange }),
            });

            const nonVatCountry = buildTaxCountryStub({ selectedCountryCode: 'US' });
            rerender(
                defaultProps({
                    isAuthenticated: false,
                    onVatChange,
                    taxCountry: nonVatCountry,
                })
            );

            expect(onVatChange).not.toHaveBeenCalled();
        });
    });

    // ─── 7. vatUpdatedInModal ────────────────────────────────────────

    describe('vatUpdatedInModal', () => {
        it('should update vatNumber with provided vatId', async () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            await act(async () => {
                await result.current.vatUpdatedInModal('MODAL-VAT');
            });

            expect(result.current.vatNumber).toBe('MODAL-VAT');
        });

        it('should set vatNumber to empty string when vatId is undefined', async () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            await act(async () => {
                await result.current.vatUpdatedInModal(undefined);
            });

            expect(result.current.vatNumber).toBe('');
        });

        it('should call onVatUpdated when isAuthenticated is true', async () => {
            const onVatUpdated = jest.fn();
            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ isAuthenticated: true, onVatUpdated, selectedPlanName: PLANS.MAIL }))
            );

            await act(async () => {
                await result.current.vatUpdatedInModal('MODAL-VAT');
            });

            expect(onVatUpdated).toHaveBeenCalledTimes(1);
        });

        it('should NOT call onVatUpdated when isAuthenticated is false', async () => {
            const onVatUpdated = jest.fn();
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false, onVatUpdated })));

            await act(async () => {
                await result.current.vatUpdatedInModal('MODAL-VAT');
            });

            expect(onVatUpdated).not.toHaveBeenCalled();
        });

        it('should pass new vatNumber to onVatUpdated', async () => {
            const onVatUpdated = jest.fn();
            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ isAuthenticated: true, onVatUpdated, selectedPlanName: PLANS.MAIL }))
            );

            act(() => {
                result.current.setVatNumber('OLD-VAT');
            });

            await act(async () => {
                await result.current.vatUpdatedInModal('NEW-VAT');
            });

            expect(onVatUpdated).toHaveBeenCalledWith('NEW-VAT');
        });
    });

    // ─── 8. countriesWithVatId coverage ──────────────────────────────

    describe('countriesWithVatId coverage', () => {
        it.each(['DE', 'FR', 'IT', 'ES', 'NL', 'PL'])('should render VAT input for EU country %s', (countryCode) => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: countryCode }),
                    })
                )
            );

            expect(result.current.renderVatNumberInput).toBe(true);
        });

        it.each(['CH', 'GB', 'NO', 'LI', 'IS'])('should render VAT input for EFTA country %s', (countryCode) => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: countryCode }),
                    })
                )
            );

            expect(result.current.renderVatNumberInput).toBe(true);
        });

        it.each(['US', 'JP', 'AU', 'BR', 'CN'])(
            'should NOT render VAT input for non-EU/EFTA country %s',
            (countryCode) => {
                const { result } = renderHook(() =>
                    useVatNumber(
                        defaultProps({
                            isAuthenticated: false,
                            taxCountry: buildTaxCountryStub({ selectedCountryCode: countryCode }),
                        })
                    )
                );

                expect(result.current.renderVatNumberInput).toBe(false);
            }
        );
    });
});
