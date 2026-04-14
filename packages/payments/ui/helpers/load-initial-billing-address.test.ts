import type {
    BillingAddress,
    BillingAddressExtended,
    FullBillingAddress,
} from '../../core/billing-address/billing-address';
import type { GetFullBillingAddressOptions, PaymentStatus } from '../../core/interface';
import { loadInitialBillingAddress } from './load-initial-billing-address';

function createPaymentStatus(billingAddress: Partial<BillingAddress>): PaymentStatus {
    return {
        CountryCode: billingAddress.CountryCode ?? '',
        State: billingAddress.State ?? null,
        ZipCode: billingAddress.ZipCode ?? null,
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
            Google: true,
        },
    };
}

function createFullBillingAddress(billingAddress: Partial<BillingAddressExtended>): FullBillingAddress {
    return {
        BillingAddress: {
            CountryCode: billingAddress.CountryCode ?? '',
            State: billingAddress.State ?? null,
            ZipCode: billingAddress.ZipCode ?? null,
            ...billingAddress,
        },
    };
}

describe('loadInitialBillingAddress', () => {
    let getPaymentStatus: jest.Mock<Promise<PaymentStatus>>;
    let getFullBillingAddress: jest.Mock<Promise<FullBillingAddress>, [GetFullBillingAddressOptions]>;

    beforeEach(() => {
        getPaymentStatus = jest.fn();
        getFullBillingAddress = jest.fn();
    });

    describe('authenticated user with valid billing address', () => {
        it('should return billing address from payment status when it is valid', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '94105',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(result.billingAddress).toMatchObject({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '94105',
            });
            expect(result.paymentStatus).toBe(paymentStatus);
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should return billing address for non-state country without zip code', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'CH',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(result.billingAddress.CountryCode).toBe('CH');
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });
    });

    describe('authenticated user with invalid billing address (missing ZIP code)', () => {
        it('should load full billing address and use it when it exists', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
                // Missing ZipCode — simulating the cohort of US users without ZIP
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const savedBillingAddress: BillingAddressExtended = {
                CountryCode: 'US',
                State: 'NY',
                ZipCode: null,
                City: 'New York',
            };
            getFullBillingAddress.mockResolvedValue({ BillingAddress: savedBillingAddress });

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(getFullBillingAddress).toHaveBeenCalledWith({ withFallback: false });
            expect(result.billingAddress).toBe(savedBillingAddress);
            expect(result.billingAddress.ZipCode).toBeNull();
            expect(result.paymentStatus).toBe(paymentStatus);
        });

        it('should return restored billing address when full billing address has no BillingAddress', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            // billing-information endpoint returns no saved billing address
            getFullBillingAddress.mockResolvedValue({ BillingAddress: undefined } as any);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(getFullBillingAddress).toHaveBeenCalledWith({ withFallback: false });
            // Should have restored ZIP code since there's no saved billing address
            expect(result.billingAddress.CountryCode).toBe('US');
            expect(result.billingAddress.State).toBe('NY');
            expect(result.billingAddress.ZipCode).toBeTruthy();
        });
    });

    describe('authenticated user with missing country', () => {
        it('should restore defaults and return valid address', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: '',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            // Missing country gets restored to CH which is valid (no states/zip required)
            expect(result.billingAddress.CountryCode).toBe('CH');
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });
    });

    describe('unauthenticated user (signup flow)', () => {
        it('should restore ZIP code for valid US address', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '94105',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: false,
            });

            expect(result.billingAddress).toMatchObject({
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '94105',
            });
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should restore missing ZIP code for US address to ensure smooth checkout', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
                // Missing ZipCode
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: false,
            });

            // For unauthenticated users, ZIP code should be restored to default
            expect(result.billingAddress.CountryCode).toBe('US');
            expect(result.billingAddress.State).toBe('NY');
            expect(result.billingAddress.ZipCode).toBeTruthy();
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should restore missing ZIP code for CA address', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'CA',
                State: 'ON',
                // Missing ZipCode
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: false,
            });

            expect(result.billingAddress.CountryCode).toBe('CA');
            expect(result.billingAddress.State).toBe('ON');
            expect(result.billingAddress.ZipCode).toBeTruthy();
            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });

        it('should never call getFullBillingAddress', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: false,
            });

            expect(getFullBillingAddress).not.toHaveBeenCalled();
        });
    });

    describe('authenticated vs unauthenticated difference for missing ZIP code', () => {
        it('authenticated user should NOT have ZIP code restored from payment status', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
                // Missing ZipCode
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            // Simulate: user has a saved billing address with missing ZIP
            getFullBillingAddress.mockResolvedValue(
                createFullBillingAddress({
                    CountryCode: 'US',
                    State: 'NY',
                    ZipCode: null,
                })
            );

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            // Authenticated user gets the saved billing address as-is (no ZIP restoration)
            expect(result.billingAddress.ZipCode).toBeNull();
        });

        it('unauthenticated user SHOULD have ZIP code restored from payment status', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
                // Missing ZipCode
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: false,
            });

            // Unauthenticated user gets ZIP code restored for smooth checkout
            expect(result.billingAddress.ZipCode).toBeTruthy();
        });
    });

    describe('edge cases', () => {
        it('should handle missing state and ZIP code for US authenticated user', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                // Missing both State and ZipCode
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            getFullBillingAddress.mockResolvedValue(
                createFullBillingAddress({
                    CountryCode: 'US',
                    State: null,
                    ZipCode: null,
                })
            );

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(getFullBillingAddress).toHaveBeenCalledWith({ withFallback: false });
            expect(result.billingAddress.CountryCode).toBe('US');
        });

        it('should always return paymentStatus from the API call', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'GB',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);

            const result = await loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress,
                isAuthenticated: true,
            });

            expect(result.paymentStatus).toBe(paymentStatus);
        });

        it('should propagate getPaymentStatus errors', async () => {
            getPaymentStatus.mockRejectedValue(new Error('Network error'));

            await expect(
                loadInitialBillingAddress({
                    getPaymentStatus,
                    getFullBillingAddress,
                    isAuthenticated: true,
                })
            ).rejects.toThrow('Network error');
        });

        it('should propagate getFullBillingAddress errors', async () => {
            const paymentStatus = createPaymentStatus({
                CountryCode: 'US',
                State: 'NY',
            });
            getPaymentStatus.mockResolvedValue(paymentStatus);
            getFullBillingAddress.mockRejectedValue(new Error('API error'));

            await expect(
                loadInitialBillingAddress({
                    getPaymentStatus,
                    getFullBillingAddress,
                    isAuthenticated: true,
                })
            ).rejects.toThrow('API error');
        });
    });
});
