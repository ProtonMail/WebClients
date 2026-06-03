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
        it('should return empty vatNumber initially for non-VAT country', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'US' }),
                    })
                )
            );

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

        it('should keep prefilled prefix when server returns no VatId', async () => {
            mockGetFullBillingAddress.mockResolvedValue({ VatId: null, BillingAddress: {} });

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('DE');
        });

        it('should keep prefilled prefix when server returns no VatId (undefined)', async () => {
            mockGetFullBillingAddress.mockResolvedValue({ BillingAddress: {} });

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('DE');
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

        it('should handle API error gracefully and keep prefilled prefix', async () => {
            mockGetFullBillingAddress.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useVatNumber(defaultProps()));

            await act(async () => {});

            expect(result.current.vatNumber).toBe('DE');
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

        it('should reset vatNumber to the new prefix and notify when switching between VAT countries', () => {
            const onVatChange = jest.fn();
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({ isAuthenticated: false, onVatChange }),
            });

            act(() => {
                result.current.setVatNumber('VAT-123');
            });
            onVatChange.mockClear();

            const frCountry = buildTaxCountryStub({ selectedCountryCode: 'FR' });
            rerender(defaultProps({ isAuthenticated: false, onVatChange, taxCountry: frCountry }));

            expect(result.current.vatNumber).toBe('FR');
            expect(onVatChange).toHaveBeenCalledWith('');
        });

        it('should NOT trigger when vatNumber is already empty', () => {
            const onVatChange = jest.fn();

            const { rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({
                    isAuthenticated: false,
                    onVatChange,
                    taxCountry: buildTaxCountryStub({ selectedCountryCode: 'US' }),
                }),
            });

            const anotherNonVatCountry = buildTaxCountryStub({ selectedCountryCode: 'JP' });
            rerender(
                defaultProps({
                    isAuthenticated: false,
                    onVatChange,
                    taxCountry: anotherNonVatCountry,
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
                await result.current.vatUpdatedInModal({
                    VatId: 'MODAL-VAT',
                    BillingAddress: {
                        CountryCode: 'DE',
                        Company: 'MODAL-COMPANY',
                        FirstName: 'MODAL-FIRST-NAME',
                        LastName: 'MODAL-LAST-NAME',
                        Address: 'MODAL-ADDRESS',
                        City: 'MODAL-CITY',
                    },
                });
            });

            expect(result.current.vatNumber).toBe('MODAL-VAT');
        });

        it('should set vatNumber to empty string when vatId is undefined', async () => {
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false })));

            await act(async () => {
                await result.current.vatUpdatedInModal({
                    VatId: undefined,
                    BillingAddress: {
                        CountryCode: 'DE',
                        Company: 'MODAL-COMPANY',
                        FirstName: 'MODAL-FIRST-NAME',
                        LastName: 'MODAL-LAST-NAME',
                        Address: 'MODAL-ADDRESS',
                        City: 'MODAL-CITY',
                    },
                });
            });

            expect(result.current.vatNumber).toBe('');
        });

        it('should call onVatUpdated when isAuthenticated is true', async () => {
            const onVatUpdated = jest.fn();
            const { result } = renderHook(() =>
                useVatNumber(defaultProps({ isAuthenticated: true, onVatUpdated, selectedPlanName: PLANS.MAIL }))
            );

            await act(async () => {
                await result.current.vatUpdatedInModal({
                    VatId: 'MODAL-VAT',
                    BillingAddress: {
                        CountryCode: 'DE',
                        Company: 'MODAL-COMPANY',
                        FirstName: 'MODAL-FIRST-NAME',
                        LastName: 'MODAL-LAST-NAME',
                        Address: 'MODAL-ADDRESS',
                        City: 'MODAL-CITY',
                    },
                });
            });

            expect(onVatUpdated).toHaveBeenCalledTimes(1);
        });

        it('should NOT call onVatUpdated when isAuthenticated is false', async () => {
            const onVatUpdated = jest.fn();
            const { result } = renderHook(() => useVatNumber(defaultProps({ isAuthenticated: false, onVatUpdated })));

            await act(async () => {
                await result.current.vatUpdatedInModal({
                    VatId: 'MODAL-VAT',
                    BillingAddress: {
                        CountryCode: 'DE',
                        Company: 'MODAL-COMPANY',
                        FirstName: 'MODAL-FIRST-NAME',
                        LastName: 'MODAL-LAST-NAME',
                        Address: 'MODAL-ADDRESS',
                        City: 'MODAL-CITY',
                    },
                });
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
                await result.current.vatUpdatedInModal({
                    VatId: 'NEW-VAT',
                    BillingAddress: {
                        CountryCode: 'DE',
                        Company: 'MODAL-COMPANY',
                        FirstName: 'MODAL-FIRST-NAME',
                        LastName: 'MODAL-LAST-NAME',
                        Address: 'MODAL-ADDRESS',
                        City: 'MODAL-CITY',
                    },
                });
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

        it.each(['GB', 'NO', 'CH', 'LI', 'IS'])(
            'should render VAT input for additional European country %s',
            (countryCode) => {
                const { result } = renderHook(() =>
                    useVatNumber(
                        defaultProps({
                            isAuthenticated: false,
                            taxCountry: buildTaxCountryStub({ selectedCountryCode: countryCode }),
                        })
                    )
                );

                expect(result.current.renderVatNumberInput).toBe(true);
            }
        );

        it.each(['US', 'JP', 'KR', 'BR', 'CN'])(
            'should NOT render VAT input for country not on the list of VAT enabled countries %s',
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

    // ─── 9. Prefill behaviour ────────────────────────────────────────

    describe('Prefill behaviour', () => {
        it('prefills VAT field with country prefix on mount for unauthenticated user', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            expect(result.current.vatNumber).toBe('DE');
        });

        it('does not prefill for US (no prefix needed)', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'US' }),
                        selectedPlanName: PLANS.MAIL_PRO,
                    })
                )
            );

            expect(result.current.vatNumber).toBe('');
        });

        it('prefills with AU for AU (ABN is prefixed with AU)', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'AU' }),
                    })
                )
            );

            expect(result.current.vatNumber).toBe('AU');
        });

        it('prefills with EL for GR, not GR', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'GR' }),
                    })
                )
            );

            expect(result.current.vatNumber).toBe('EL');
        });

        it('does not prefill when initialVatNumber is provided', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        initialVatNumber: 'DE123456789',
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            expect(result.current.vatNumber).toBe('DE123456789');
        });

        it('updates prefix when country changes while field is pristine', () => {
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({
                    isAuthenticated: false,
                    taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                }),
            });

            expect(result.current.vatNumber).toBe('DE');

            rerender(
                defaultProps({ isAuthenticated: false, taxCountry: buildTaxCountryStub({ selectedCountryCode: 'FR' }) })
            );

            expect(result.current.vatNumber).toBe('FR');
        });

        it('overwrites a user-entered VAT number with the new prefix when the country changes', () => {
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({
                    isAuthenticated: false,
                    taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                }),
            });

            act(() => {
                result.current.setVatNumber('DE123456789');
            });

            rerender(
                defaultProps({ isAuthenticated: false, taxCountry: buildTaxCountryStub({ selectedCountryCode: 'FR' }) })
            );

            expect(result.current.vatNumber).toBe('FR');
        });

        it('resets to pristine and re-prefills after switching to non-VAT country and back', () => {
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({
                    isAuthenticated: false,
                    taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                }),
            });

            // Switch to non-VAT country — clears
            rerender(
                defaultProps({ isAuthenticated: false, taxCountry: buildTaxCountryStub({ selectedCountryCode: 'JP' }) })
            );
            expect(result.current.vatNumber).toBe('');

            // Switch back to VAT country — re-prefills
            rerender(
                defaultProps({ isAuthenticated: false, taxCountry: buildTaxCountryStub({ selectedCountryCode: 'FR' }) })
            );
            expect(result.current.vatNumber).toBe('FR');
        });

        it('fetch still runs for authenticated user even when field is prefilled', async () => {
            mockGetFullBillingAddress.mockResolvedValue({ VatId: 'DE123456789' });

            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: true,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            await act(async () => {});

            expect(mockGetFullBillingAddress).toHaveBeenCalledTimes(1);
            expect(result.current.vatNumber).toBe('DE123456789');
        });

        it('keeps the prefill when server returns no VatId for authenticated user', async () => {
            mockGetFullBillingAddress.mockResolvedValue({ VatId: null, BillingAddress: {} });

            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: true,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            await act(async () => {});

            expect(result.current.vatNumber).toBe('DE');
        });

        it('re-prefills when VAT section is expanded after collapsing', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            act(() => {
                result.current.setUnauthenticatedCollapsed(true);
            });
            expect(result.current.vatNumber).toBe('');

            act(() => {
                result.current.setUnauthenticatedCollapsed(false);
            });
            expect(result.current.vatNumber).toBe('DE');
        });

        it('clears field on B2B → non-B2B and re-prefills on B2B return (pristine is reset on clear)', () => {
            const { result, rerender } = renderHook((props) => useVatNumber(props), {
                initialProps: defaultProps({ isAuthenticated: false }),
            });

            act(() => {
                result.current.setVatNumber('DE123456789');
            });
            expect(result.current.vatNumber).toBe('DE123456789');

            // Switching to a consumer plan clears the field and resets pristine
            rerender(defaultProps({ isAuthenticated: false, selectedPlanName: PLANS.MAIL }));
            expect(result.current.vatNumber).toBe('');

            // Returning to a B2B plan re-prefills with the country prefix
            rerender(defaultProps({ isAuthenticated: false, selectedPlanName: PLANS.MAIL_PRO }));
            expect(result.current.vatNumber).toBe('DE');
        });

        it('re-prefills even when expand is called without a prior collapse (idempotent)', () => {
            const { result } = renderHook(() =>
                useVatNumber(
                    defaultProps({
                        isAuthenticated: false,
                        taxCountry: buildTaxCountryStub({ selectedCountryCode: 'DE' }),
                    })
                )
            );

            act(() => {
                result.current.setVatNumber('DE123456789');
            });

            // Calling expand without a prior collapse resets pristine and re-prefills
            act(() => {
                result.current.setUnauthenticatedCollapsed(false);
            });
            expect(result.current.vatNumber).toBe('DE');
        });
    });
});
