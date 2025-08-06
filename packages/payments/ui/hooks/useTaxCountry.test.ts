import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { useFlag } from '@proton/unleash';

import { DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address/billing-address';
import { useTaxCountry } from './useTaxCountry';

// Mock the feature flag to be enabled by default for all tests (to match existing test expectations)
jest.mock('@proton/unleash', () => ({
    useFlag: jest.fn().mockReturnValue(true),
}));

const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

describe('useTaxCountry hook', () => {
    beforeEach(() => {
        // Reset to default (enabled) before each test to match existing test expectations
        mockUseFlag.mockReturnValue(true);
    });

    describe('Core Functionality', () => {
        it('should initialize with statusExtended values when provided', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA');
        });

        it('should initialize with default values when statusExtended is not provided', () => {
            const { result } = renderHook(() => useTaxCountry({ zipCodeBackendValid: true }));

            expect(result.current.selectedCountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
            expect(result.current.federalStateCode).toBe(null);
        });

        it('should update billing address when statusExtended changes', () => {
            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
                },
            });

            // Initial values
            expect(result.current.selectedCountryCode).toBe('US');
            expect(result.current.federalStateCode).toBe('CA');

            // Update props
            rerender({
                statusExtended: {
                    CountryCode: 'CA',
                    State: 'ON',
                },
                zipCodeBackendValid: true,
            });

            // Values should be updated
            expect(result.current.selectedCountryCode).toBe('CA');
            expect(result.current.federalStateCode).toBe('ON');
        });

        it('should not update billing address if statusExtended values are the same', () => {
            const onBillingAddressChange = jest.fn();
            const { rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    onBillingAddressChange,
                    zipCodeBackendValid: true,
                },
            });

            // Re-render with same values
            rerender({
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                },
                onBillingAddressChange,
                zipCodeBackendValid: true,
            });

            // onBillingAddressChange should not be called during initial render if the values are the same
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should call onBillingAddressChange when billing address updates', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    zipCodeBackendValid: true,
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
                    zipCodeBackendValid: true,
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

        it('should use default values when no statusExtended props provided', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    zipCodeBackendValid: true,
                })
            );

            expect(result.current.selectedCountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
            expect(result.current.federalStateCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.State);
            expect(result.current.zipCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.ZipCode);
        });

        it('should handle previous valid zip code override functionality', () => {
            const onBillingAddressChange = jest.fn();
            const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                initialProps: {
                    onBillingAddressChange,
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90000', // Some zip code that might be invalid
                    },
                    zipCodeBackendValid: false,
                    previosValidZipCode: '90210', // Previous valid zip code
                },
            });

            expect(result.current.zipCode).toBe('90000');

            // When zipCodeBackendValid becomes true, should override with previous valid zip code
            rerender({
                onBillingAddressChange,
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                    ZipCode: '90000',
                },
                zipCodeBackendValid: true,
                previosValidZipCode: '90210',
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: true,
                    previosValidZipCode: '90001',
                },
            });

            expect(result.current.zipCode).toBe('90210');

            // When zipCodeBackendValid is already true, should not override
            rerender({
                onBillingAddressChange,
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                    ZipCode: '90210',
                },
                zipCodeBackendValid: true,
                previosValidZipCode: '90001',
            });

            expect(result.current.zipCode).toBe('90210'); // Should remain unchanged
            expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
        });

        it('should not update when values are the same (early returns)', () => {
            const onBillingAddressChange = jest.fn();
            const { result } = renderHook(() =>
                useTaxCountry({
                    onBillingAddressChange,
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: true,
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
            };

            const { result } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        ZipCode: '90210',
                    },
                    paymentFacade: mockPaymentFacade as any,
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        // No State provided
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: '',
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(missingCountry.current.billingAddressErrorMessage).toBe('Please select billing country');

            // Missing zip code for US
            const { result: missingZipUS } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        // No ZipCode
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(missingZipUS.current.billingAddressErrorMessage).toBe('Please enter ZIP code');

            // Missing zip code for international country
            const { result: missingZipIntl } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'GB',
                        // No ZipCode
                    },
                    zipCodeBackendValid: true,
                })
            );

            // GB doesn't require postal codes, so no error message
            expect(missingZipIntl.current.billingAddressErrorMessage).toBe(undefined);
        });

        it('should differentiate US vs international error messages', () => {
            // Invalid zip code for US
            const { result: invalidUS } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: 'invalid',
                    },
                    zipCodeBackendValid: false,
                })
            );

            expect(invalidUS.current.billingAddressErrorMessage).toBe('Please enter a valid ZIP code');

            // Invalid zip code for international
            const { result: invalidIntl } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'GB',
                        ZipCode: 'invalid',
                    },
                    zipCodeBackendValid: false,
                })
            );

            expect(invalidIntl.current.billingAddressErrorMessage).toBe('Please enter a valid postal code');
        });
    });

    describe('Countries with States Support', () => {
        it('should handle US states correctly', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    zipCodeBackendValid: true,
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
                    zipCodeBackendValid: true,
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
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'AL',
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
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
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                    },
                    zipCodeBackendValid: true,
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
            };

            const { unmount } = renderHook(() =>
                useTaxCountry({
                    paymentFacade: mockPaymentFacade as any,
                    zipCodeBackendValid: true,
                })
            );

            // Should not throw on unmount
            expect(() => unmount()).not.toThrow();
        });

        it('should handle empty strings correctly', () => {
            const { result } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: '',
                        State: '',
                        ZipCode: '',
                    },
                    zipCodeBackendValid: true,
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
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(validResult.current.billingAddressValid).toBe(true);
            expect(validResult.current.zipCodeBackendValid).toBe(true);

            const { result: invalidResult } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: false,
                })
            );

            expect(invalidResult.current.billingAddressValid).toBe(false);
            expect(invalidResult.current.zipCodeBackendValid).toBe(false);
        });

        it('should provide correct billing address status scenarios', () => {
            // Valid scenario
            const { result: valid } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(valid.current.billingAddressStatus.valid).toBe(true);
            expect(valid.current.billingAddressStatus.reason).toBe(undefined);

            // Missing country
            const { result: missingCountry } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: '',
                    },
                    zipCodeBackendValid: true,
                })
            );

            expect(missingCountry.current.billingAddressStatus.valid).toBe(false);
            expect(missingCountry.current.billingAddressStatus.reason).toBe('missingCountry');

            // Invalid zip code
            const { result: invalidZip } = renderHook(() =>
                useTaxCountry({
                    statusExtended: {
                        CountryCode: 'US',
                        State: 'CA',
                        ZipCode: '90210',
                    },
                    zipCodeBackendValid: false,
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
                    zipCodeBackendValid: true,
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

    // must be removed once the PaymentsZipCodeValidation flag is removed
    describe('Feature Flag Behavior', () => {
        describe('when PaymentsZipCodeValidation flag is disabled', () => {
            beforeEach(() => {
                mockUseFlag.mockReturnValue(false);
            });

            it('should exclude ZipCode from billing address callback when flag is disabled', () => {
                const onBillingAddressChange = jest.fn();
                const { result } = renderHook(() =>
                    useTaxCountry({
                        onBillingAddressChange,
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                            ZipCode: '90210',
                        },
                        zipCodeBackendValid: true,
                    })
                );

                // Change country - should trigger callback without ZipCode
                act(() => {
                    result.current.setSelectedCountry('CA');
                });

                expect(onBillingAddressChange).toHaveBeenCalledWith({
                    CountryCode: 'CA',
                    State: 'AB', // First Canadian state
                    // Note: ZipCode should be excluded from the callback
                });

                // Verify the hook still tracks the zip code internally
                expect(result.current.zipCode).toBe('T5J 2R7'); // Default zip for AB
            });

            it('should exclude ZipCode from billing address callback when setting state', () => {
                const onBillingAddressChange = jest.fn();
                const { result } = renderHook(() =>
                    useTaxCountry({
                        onBillingAddressChange,
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'AL',
                        },
                        zipCodeBackendValid: true,
                    })
                );

                // Change state - should trigger callback without ZipCode
                act(() => {
                    result.current.setFederalStateCode('CA');
                });

                expect(onBillingAddressChange).toHaveBeenCalledWith({
                    CountryCode: 'US',
                    State: 'CA',
                    // Note: ZipCode should be excluded from the callback
                });
            });

            it('should not trigger callback when setting zip code (since validation is disabled)', () => {
                const onBillingAddressChange = jest.fn();
                const { result } = renderHook(() =>
                    useTaxCountry({
                        onBillingAddressChange,
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                        },
                        zipCodeBackendValid: true,
                    })
                );

                // Set a valid zip code - should not trigger callback when flag is disabled
                act(() => {
                    result.current.setZipCode('90210');
                });

                expect(result.current.zipCode).toBe('90210');
                expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
            });

            it('should exclude ZipCode from initial billing address callback when statusExtended changes', () => {
                const onBillingAddressChange = jest.fn();
                const { rerender } = renderHook((props) => useTaxCountry(props), {
                    initialProps: {
                        onBillingAddressChange,
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                            ZipCode: '90210',
                        },
                        zipCodeBackendValid: true,
                    },
                });

                // Update statusExtended - should trigger callback without ZipCode
                rerender({
                    onBillingAddressChange,
                    statusExtended: {
                        CountryCode: 'CA',
                        State: 'ON',
                        ZipCode: 'M5H 2N2',
                    },
                    zipCodeBackendValid: true,
                });

                expect(onBillingAddressChange).toHaveBeenCalledWith({
                    CountryCode: 'CA',
                    State: 'ON',
                    // Note: ZipCode should be excluded from the callback
                });
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
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                            ZipCode: '90210',
                        },
                        zipCodeBackendValid: true,
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
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                        },
                        zipCodeBackendValid: true,
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

        describe('feature flag transition scenarios', () => {
            it('should maintain consistent behavior when flag transitions from disabled to enabled', () => {
                const onBillingAddressChange = jest.fn();

                // Start with flag disabled
                mockUseFlag.mockReturnValue(false);

                const { result, rerender } = renderHook((props) => useTaxCountry(props), {
                    initialProps: {
                        onBillingAddressChange,
                        statusExtended: {
                            CountryCode: 'US',
                            State: 'CA',
                            ZipCode: '90210',
                        },
                        zipCodeBackendValid: true,
                    },
                });

                // Make a change with flag disabled
                act(() => {
                    result.current.setSelectedCountry('CA');
                });

                expect(onBillingAddressChange).toHaveBeenLastCalledWith({
                    CountryCode: 'CA',
                    State: 'AB',
                    // ZipCode excluded when flag disabled
                });

                // Enable the flag
                mockUseFlag.mockReturnValue(true);

                // Force re-render to pick up the new flag value
                rerender({
                    onBillingAddressChange,
                    statusExtended: {
                        CountryCode: 'CA',
                        State: 'AB',
                        ZipCode: 'T5J 2R7',
                    },
                    zipCodeBackendValid: true,
                });

                // Make another change with flag enabled
                act(() => {
                    result.current.setFederalStateCode('ON');
                });

                expect(onBillingAddressChange).toHaveBeenLastCalledWith({
                    CountryCode: 'CA',
                    State: 'ON',
                    ZipCode: 'M5H 2N2', // ZipCode included when flag enabled
                });
            });
        });
    });
});
