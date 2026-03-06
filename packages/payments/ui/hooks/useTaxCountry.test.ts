import { act } from 'react';

import { renderHook as baseRenderHook } from '@testing-library/react';

import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { componentWrapper, withConfig, withReduxStore } from '@proton/testing';
import useFlag from '@proton/unleash/useFlag';

import { DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address/billing-address';
import type { SubscriptionEstimation } from '../../core/subscription/interface';
import { useTaxCountry } from './useTaxCountry';

// Mock the feature flag to be enabled by default for all tests (to match existing test expectations)
jest.mock('@proton/unleash', () => ({
    useFlag: jest.fn().mockReturnValue(true),
    useGetFlag: jest.fn().mockReturnValue(() => true),
}));

const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

const getWrapper = () => componentWrapper(withReduxStore(), withConfig());

const renderHook: typeof baseRenderHook = (render, options) =>
    baseRenderHook(render, { wrapper: getWrapper(), ...options });

const mockValidZipCode = { checkResult: { error: undefined } as SubscriptionEstimation } as PaymentFacade;
const mockInvalidZipCode = {
    checkResult: { error: new InvalidZipCodeError() } as SubscriptionEstimation,
} as PaymentFacade;

describe('useTaxCountry hook', () => {
    beforeEach(() => {
        // Reset to default (enabled) before each test to match existing test expectations
        mockUseFlag.mockReturnValue(true);
    });

    describe('Core Functionality', () => {
        it('should initialize with paymentStatus values when provided', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA');
        });

        it('should initialize with default values when paymentStatus is not provided', () => {
            const { result } = renderHook(() =>
                useTaxCountry({ paymentFacade: mockValidZipCode, telemetryContext: 'other' })
            );

            expect(result.current.selectedCountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
            expect(result.current.federalStateCode).toBe(null);
        });

        it('should update billing address when paymentStatus changes', () => {
            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other' as const,
                },
            });

            // Initial values
            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA');

            // Update props
            rerender({
                paymentStatus: {
                    CountryCode: 'CA',
                    State: 'ON',
                },
                paymentFacade: mockValidZipCode,
                telemetryContext: 'other',
            });

            // Values should be updated
            expect(result.current.selectedCountryCode).toBe('CA');
            expect(result.current.federalStateCode).toBe('ON');
        });

        it('should not update billing address if paymentStatus values are the same', () => {
            const onBillingAddressChange = jest.fn();
            const { rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    onBillingAddressChange,
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other' as const,
                },
            });

            // Re-render with same values
            rerender({
                paymentStatus: {
                    CountryCode: 'US',
                    State: 'CA',
                },
                onBillingAddressChange,
                paymentFacade: mockValidZipCode,
                telemetryContext: 'other',
            });

            // onBillingAddressChange should not be called during initial render if the values are the same
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should call onBillingAddressChange when billing address updates', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Manually update country
            act(() => {
                result.current.setSelectedCountry('CA');
            });

            expect(onBillingAddressChange).toHaveBeenLastCalledWith({
                CountryCode: 'CA',
                State: 'AB', // First state in Canada's list
                ZipCode: 'T5J 2R7',
            });
        });

        it('should handle cascading state transitions (country → state → zip code)', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Change country (should update state and zip)
            act(() => {
                result.current.setSelectedCountry('US');
            });

            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA'); // Default US state
            expect(result.current.zipCode).toBe('93771'); // Default CA zip

            // Change state (should update zip)
            act(() => {
                result.current.setFederalStateCode('CA');
            });

            expect(result.current.federalStateCode).toBe('CA');
            expect(result.current.zipCode).toBe('93771'); // Default CA zip

            // Change zip code only
            act(() => {
                result.current.setZipCode('90210');
            });

            expect(result.current.zipCode).toBe('90210');
        });

        it('should use default values when no paymentStatus props provided', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(result.current.selectedCountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
            expect(result.current.federalStateCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.State);
            expect(result.current.zipCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.ZipCode);
        });

        // This case is now handled on the parent level of useTaxCountry by informedFallback property of
        // checkSubscription
        it.skip('should handle previous valid zip code override functionality', () => {
            const onBillingAddressChange = jest.fn();
            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90000', // Some zip code that might be invalid
                    },
                    paymentFacade: mockInvalidZipCode,
                    previousValidZipCode: '90210', // Previous valid zip code
                    telemetryContext: 'other' as const,
                },
            });

            expect(result.current.zipCode).toBe('90000');

            // When zipCodeBackendValid becomes true, should override with previous valid zip code
            rerender({
                onBillingAddressChange,
                paymentStatus: {
                    CountryCode: 'US',
                    State: 'CA',
                    ZipCode: '90000',
                },
                paymentFacade: mockValidZipCode,
                previousValidZipCode: '90210',
                telemetryContext: 'other',
            });

            expect(result.current.zipCode).toBe('90210');
            // Should not call onBillingAddressChange because it uses skipCallback internally
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should not override zip code when already valid', () => {
            const onBillingAddressChange = jest.fn();
            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockValidZipCode,
                    previousValidZipCode: '90001',
                    telemetryContext: 'other' as const,
                },
            });

            expect(result.current.zipCode).toBe('90210');

            // When zipCodeBackendValid is already true, should not override
            rerender({
                onBillingAddressChange,
                paymentStatus: {
                    CountryCode: 'US',
                    State: 'CA',
                    ZipCode: '90210',
                },
                paymentFacade: mockValidZipCode,
                previousValidZipCode: '90001',
                telemetryContext: 'other',
            });

            expect(result.current.zipCode).toBe('90210'); // Should remain unchanged
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should not update when values are the same (early returns)', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Try to set same country
            act(() => {
                result.current.setSelectedCountry('US');
            });

            // Try to set same state
            act(() => {
                result.current.setFederalStateCode('CA');
            });

            // Try to set same zip code
            act(() => {
                result.current.setZipCode('90210');
            });

            // Should not have called the callback at all
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should integrate with PaymentFacade chargebee card', () => {
            const mockPaymentFacade = {
                chargebeeCard: {
                    setCountryCode: jest.fn(),
                    setPostalCode: jest.fn(),
                },
                checkResult: { error: undefined } as SubscriptionEstimation,
            };

            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockPaymentFacade as any,
                    telemetryContext: 'other',
                })
            );

            // Should call chargebee card methods on initialization
            expect(mockPaymentFacade.chargebeeCard.setCountryCode).toHaveBeenCalledWith('US');
            expect(mockPaymentFacade.chargebeeCard.setPostalCode).toHaveBeenCalledWith('90210');

            // Should call when country changes
            act(() => {
                result.current.setSelectedCountry('CA');
            });

            expect(mockPaymentFacade.chargebeeCard.setCountryCode).toHaveBeenCalledWith('CA');
        });
    });

    describe('Validation & Error Messages', () => {
        it('should handle invalid zip codes', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Set invalid zip code
            act(() => {
                result.current.setZipCode('invalid');
            });

            expect(result.current.zipCode).toBe('invalid');
            // Should not trigger callback for invalid zip codes
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should validate missing state for countries that require states', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        // No State provided
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(result.current.billingAddressStatus.valid).toBe(false);
            expect(result.current.billingAddressStatus.reason).toBe('missingState');
            expect(result.current.billingAddressErrorMessage).toBe('Please select billing state');
        });

        it('should provide different error messages for different scenarios', () => {
            // Missing country
            const { result: missingCountry } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: '',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(missingCountry.current.billingAddressErrorMessage).toBe('Please select billing country');

            // Missing zip code for US
            const { result: missingZipUS } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        // No ZipCode
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(missingZipUS.current.billingAddressErrorMessage).toBe('Please enter ZIP code');

            // Missing zip code for international country
            const { result: missingZipIntl } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'GB',
                        // No ZipCode
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // GB doesn't require postal codes, so no error message
            expect(missingZipIntl.current.billingAddressErrorMessage).toBe(undefined);
        });

        it('should differentiate US vs international error messages', () => {
            // Invalid zip code for US
            const { result: invalidUS } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: 'invalid',
                    },
                    paymentFacade: mockInvalidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(invalidUS.current.billingAddressErrorMessage).toBe('Please enter a valid ZIP code');

            // Invalid zip code for international
            const { result: invalidIntl } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'GB',
                        ZipCode: 'invalid',
                    },
                    paymentFacade: mockInvalidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(invalidIntl.current.billingAddressErrorMessage).toBe('Please enter a valid postal code');
        });
    });

    describe('Countries with States Support', () => {
        it('should handle US states correctly', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            act(() => {
                result.current.setSelectedCountry('US');
            });

            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA'); // Default US state
            expect(result.current.zipCode).toBe('93771'); // Default CA zip
        });

        it('should handle Canada states correctly', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            act(() => {
                result.current.setSelectedCountry('CA');
            });

            expect(result.current.selectedCountryCode).toBe('CA');
            expect(result.current.federalStateCode).toBe('AB'); // Default CA state
            expect(result.current.zipCode).toBe('T5J 2R7'); // Default AB zip
        });
    });

    describe('Country/State Logic and Callbacks', () => {
        it('should handle countries without states', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            act(() => {
                result.current.setSelectedCountry('GB'); // UK doesn't have states
            });

            expect(result.current.selectedCountryCode).toBe('GB');
            expect(result.current.federalStateCode).toBe(null);
            expect(result.current.zipCode).toBe(null);
        });

        it('should set default postal codes for state changes', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            act(() => {
                result.current.setFederalStateCode('CA');
            });

            expect(result.current.federalStateCode).toBe('CA');
            expect(result.current.zipCode).toBe('93771'); // Default CA zip
        });

        it('should handle invalid state codes gracefully', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // This should still work even with invalid state code
            act(() => {
                result.current.setFederalStateCode('INVALID');
            });

            expect(result.current.federalStateCode).toBe('INVALID');
        });

        it('should call callbacks at the right times', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Valid zip code should trigger callback
            act(() => {
                result.current.setZipCode('90210');
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);

            // Invalid zip code should not trigger callback
            act(() => {
                result.current.setZipCode('invalid');
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1); // Still 1
        });

        it('should respect skipCallback option', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // With skipCallback: true
            act(() => {
                result.current.setZipCode('90210', { skipCallback: true });
            });

            expect(result.current.zipCode).toBe('90210');
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);

            // With skipCallback: false (default)
            act(() => {
                result.current.setZipCode('90211');
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple rapid changes correctly', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Multiple rapid changes
            act(() => {
                result.current.setSelectedCountry('US');
                result.current.setFederalStateCode('CA');
                result.current.setZipCode('90210');
            });

            // Should end up with final values
            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA');
            expect(result.current.zipCode).toBe('90210');
        });

        it('should handle callback errors gracefully', () => {
            const throwingCallback = jest.fn(() => {
                throw new Error('Callback error');
            });

            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange: throwingCallback,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Initial zip code should be null because we didn't provide one
            expect(result.current.zipCode).toBe(null);

            // Trying to set a valid zip code should call the callback and throw
            let caughtError;
            try {
                act(() => {
                    result.current.setZipCode('90210');
                });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toEqual(new Error('Callback error'));
            expect(throwingCallback).toHaveBeenCalledTimes(1);

            // This test verifies the callback is called and throws as expected
        });
    });

    describe('Re-rendering and Edge Cases', () => {
        it('should cleanup properly on unmount', () => {
            const mockPaymentFacade = {
                chargebeeCard: {
                    setCountryCode: jest.fn(),
                    setPostalCode: jest.fn(),
                },
                checkResult: { error: undefined } as SubscriptionEstimation,
            };

            const { unmount } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockPaymentFacade as any,
                    telemetryContext: 'other',
                })
            );

            // Should not throw on unmount
            expect(() => unmount()).not.toThrow();
        });

        it('should handle empty strings correctly', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: '',
                        State: '',
                        ZipCode: '',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(result.current.selectedCountryCode).toBe('');
            expect(result.current.federalStateCode).toBe('');
            expect(result.current.zipCode).toBe('');

            // Should handle setting empty strings
            act(() => {
                result.current.setZipCode('');
            });

            expect(result.current.zipCode).toBe('');
        });
    });

    describe('Business Logic Integration', () => {
        it('should integrate zipCodeBackendValid flag correctly', () => {
            const { result: validResult } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(validResult.current.billingAddressValid).toBe(true);
            expect(validResult.current.zipCodeBackendValid).toBe(true);

            const { result: invalidResult } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockInvalidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(invalidResult.current.billingAddressValid).toBe(false);
            expect(invalidResult.current.zipCodeBackendValid).toBe(false);
        });

        it('should provide correct billing address status scenarios', () => {
            // Valid scenario
            const { result: valid } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(valid.current.billingAddressStatus.valid).toBe(true);
            expect(valid.current.billingAddressStatus.reason).toBe(undefined);

            // Missing country
            const { result: missingCountry } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: '',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(missingCountry.current.billingAddressStatus.valid).toBe(false);
            expect(missingCountry.current.billingAddressStatus.reason).toBe('missingCountry');

            // Invalid zip code
            const { result: invalidZip } = renderHook(() =>
                useTaxCountry({
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockInvalidZipCode,
                    telemetryContext: 'other',
                })
            );

            expect(invalidZip.current.billingAddressStatus.valid).toBe(false);
            expect(invalidZip.current.billingAddressStatus.reason).toBe('invalidZipCode');
        });
    });

    describe('Concurrent/Async Scenarios', () => {
        it('should handle race conditions with rapid successive calls', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other',
                })
            );

            // Simulate rapid successive calls
            act(() => {
                result.current.setSelectedCountry('US');
            });

            act(() => {
                result.current.setSelectedCountry('CA');
            });

            act(() => {
                result.current.setSelectedCountry('US');
            });

            // Should end up with the final state
            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA'); // Default US state

            // Should have called callback for each valid change
            expect(onBillingAddressChange).toHaveBeenCalledTimes(3);
        });
    });

    describe('when PaymentsZipCodeValidation flag is enabled', () => {
        beforeEach(() => {
            mockUseFlag.mockReturnValue(true);
        });

        it('should include ZipCode in billing address callback when flag is enabled', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockValidZipCode,
                    telemetryContext: 'other' as const,
                })
            );

            // Change country - should trigger callback with ZipCode included
            act(() => {
                result.current.setSelectedCountry('CA');
            });

            expect(onBillingAddressChange).toHaveBeenCalledWith({
                CountryCode: 'CA',
                State: 'AB',
                ZipCode: 'T5J 2R7',
            });
        });

        it('should trigger callback when setting valid zip code', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    telemetryContext: 'other',
                })
            );

            // Set a valid zip code - should trigger callback when flag is enabled
            act(() => {
                result.current.setZipCode('90210');
            });

            expect(result.current.zipCode).toBe('90210');
            expect(onBillingAddressChange).toHaveBeenCalledWith({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '90210',
            });
        });
    });

    describe('Outer state staleness when payment status changes', () => {
        const chargebeeCardStub = {
            setCountryCode: jest.fn(),
            setPostalCode: jest.fn(),
        };

        it('should call onBillingAddressChange when no paymentFacade is provided', () => {
            const onBillingAddressChange = jest.fn();
            const { rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    onBillingAddressChange,
                    zipCodeBackendValid: true,
                    telemetryContext: 'other' as const,
                },
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);

            rerender({
                paymentStatus: {
                    CountryCode: 'CA',
                    State: 'ON',
                    ZipCode: 'K1A 0B1',
                },
                onBillingAddressChange,
                zipCodeBackendValid: true,
                telemetryContext: 'other',
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);
            expect(onBillingAddressChange).toHaveBeenCalledWith({
                CountryCode: 'CA',
                State: 'ON',
                ZipCode: 'K1A 0B1',
            });
        });

        it('should call onBillingAddressChange when paymentFacade has no checkResult', () => {
            const onBillingAddressChange = jest.fn();
            const mockPaymentFacade = {
                chargebeeCard: chargebeeCardStub,
            };

            const { rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    onBillingAddressChange,
                    paymentFacade: mockPaymentFacade as any,
                    zipCodeBackendValid: true,
                    telemetryContext: 'other' as const,
                },
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);

            rerender({
                paymentStatus: {
                    CountryCode: 'CA',
                    State: 'ON',
                    ZipCode: 'K1A 0B1',
                },
                onBillingAddressChange,
                paymentFacade: mockPaymentFacade as any,
                zipCodeBackendValid: true,
                telemetryContext: 'other',
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);
            expect(onBillingAddressChange).toHaveBeenCalledWith({
                CountryCode: 'CA',
                State: 'ON',
                ZipCode: 'K1A 0B1',
            });
        });

        it('should call onBillingAddressChange when checkResult billing address differs from new payment status', () => {
            const onBillingAddressChange = jest.fn();
            const mockPaymentFacade = {
                chargebeeCard: chargebeeCardStub,
                checkResult: {
                    requestData: {
                        BillingAddress: {
                            CountryCode: 'US',
                            State: 'CA',
                            ZipCode: '90210',
                        },
                    },
                },
            };

            const { rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    onBillingAddressChange,
                    paymentFacade: mockPaymentFacade as any,
                    zipCodeBackendValid: true,
                    telemetryContext: 'other' as const,
                },
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);

            rerender({
                paymentStatus: {
                    CountryCode: 'CA',
                    State: 'ON',
                    ZipCode: 'K1A 0B1',
                },
                onBillingAddressChange,
                paymentFacade: mockPaymentFacade as any,
                zipCodeBackendValid: true,
                telemetryContext: 'other',
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);
            expect(onBillingAddressChange).toHaveBeenCalledWith({
                CountryCode: 'CA',
                State: 'ON',
                ZipCode: 'K1A 0B1',
            });
        });

        it('should NOT call onBillingAddressChange when checkResult billing address matches new payment status', () => {
            const onBillingAddressChange = jest.fn();
            const newBillingAddress = {
                CountryCode: 'CA',
                State: 'ON',
                ZipCode: 'K1A 0B1',
            };

            const mockPaymentFacade = {
                chargebeeCard: chargebeeCardStub,
                checkResult: {
                    requestData: {
                        BillingAddress: newBillingAddress,
                    },
                },
            };

            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    onBillingAddressChange,
                    paymentFacade: mockPaymentFacade as any,
                    zipCodeBackendValid: true,
                    telemetryContext: 'other' as const,
                },
            });

            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);

            rerender({
                paymentStatus: newBillingAddress,
                onBillingAddressChange,
                paymentFacade: mockPaymentFacade as any,
                zipCodeBackendValid: true,
                telemetryContext: 'other',
            });

            // Local state should be updated
            expect(result.current.selectedCountryCode).toBe('CA');
            expect(result.current.federalStateCode).toBe('ON');
            expect(result.current.zipCode).toBe('K1A 0B1');

            // But onBillingAddressChange should NOT be called because
            // the outer state (checkResult) already has the correct address
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });
    });

    describe('billingAddressChangedInModal', () => {
        it('should update local state and call onBillingAddressChange', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    paymentStatus: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    telemetryContext: 'other',
                })
            );

            const newBillingAddress = {
                CountryCode: 'DE',
                State: null,
                ZipCode: '10115',
            };

            act(() => {
                result.current.billingAddressChangedInModal(newBillingAddress);
            });

            expect(result.current.selectedCountryCode).toBe('DE');
            expect(result.current.federalStateCode).toBe(null);
            expect(result.current.zipCode).toBe('10115');

            expect(onBillingAddressChange).toHaveBeenCalledTimes(1);
            expect(onBillingAddressChange).toHaveBeenCalledWith(newBillingAddress);
        });
    });
});
