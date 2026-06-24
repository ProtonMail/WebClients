import type { CheckSubscriptionData } from '../../core/api/api';
import { ADDON_NAMES, CYCLE, PLANS } from '../../core/constants';
import { SubscriptionMode } from '../../core/subscription/constants';
import type { CouponDiscountBreakdownBE, SubscriptionEstimation } from '../../core/subscription/interface';
import { getStaticCouponConfig } from './get-static-coupon-config';
import type { CouponConfig } from './interface';
import { enrichMockCouponDiscountBreakdown } from './mock-coupon-discount-breakdown';

// Decouple the helper from live coupon configs: the test mocks getStaticCouponConfig and supplies its own
// config under a test-only coupon code, so it exercises the machinery rather than whatever data a real
// (and typically short-lived) campaign config happens to carry at any given time.
jest.mock('./get-static-coupon-config', () => ({
    getStaticCouponConfig: jest.fn(),
}));

const TEST_COUPON_CODE = 'TEST-COUPON';

const mockBreakdownConfig = {
    mockCouponDiscountBreakdown: {
        EUR: {
            [CYCLE.YEARLY]: [
                { Name: PLANS.BUNDLE, Amount: -4200 },
                { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: -2400 },
            ],
        },
    },
} as unknown as CouponConfig;

beforeEach(() => {
    jest.mocked(getStaticCouponConfig).mockImplementation((couponCode) =>
        couponCode === TEST_COUPON_CODE ? mockBreakdownConfig : undefined
    );
});

const makeResult = (overrides: Partial<SubscriptionEstimation> = {}): SubscriptionEstimation => ({
    Amount: 23976,
    AmountDue: 17376,
    Cycle: CYCLE.YEARLY,
    CouponDiscount: -6600,
    Coupon: { Code: TEST_COUPON_CODE, Description: '', MaximumRedemptionsPerUser: null },
    Currency: 'EUR',
    SubscriptionMode: SubscriptionMode.Regular,
    BaseRenewAmount: null,
    RenewCycle: null,
    PeriodEnd: 0,
    requestData: {
        Plans: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 },
        Currency: 'EUR',
        Cycle: CYCLE.YEARLY,
    },
    ...overrides,
});

const makeData = (overrides: Partial<CheckSubscriptionData> = {}): CheckSubscriptionData => ({
    Plans: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 },
    Currency: 'EUR',
    Cycle: CYCLE.YEARLY,
    CouponCode: TEST_COUPON_CODE,
    ...overrides,
});

describe('enrichMockCouponDiscountBreakdown', () => {
    it('injects the breakdown filtered to the requested plans', () => {
        const result = makeResult();

        enrichMockCouponDiscountBreakdown(result, makeData());

        expect(result.Coupon?.CouponDiscountBreakdown).toEqual([
            { Name: PLANS.BUNDLE, Amount: -4200 },
            { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: -2400 },
        ]);
    });

    it('filters out plans that are not part of the request', () => {
        const result = makeResult({ CouponDiscount: -4200 });

        enrichMockCouponDiscountBreakdown(result, makeData({ Plans: { [PLANS.BUNDLE]: 1 } }));

        expect(result.Coupon?.CouponDiscountBreakdown).toEqual([{ Name: PLANS.BUNDLE, Amount: -4200 }]);
    });

    it('reads the coupon from Codes when CouponCode is absent', () => {
        const result = makeResult();

        enrichMockCouponDiscountBreakdown(result, makeData({ CouponCode: undefined, Codes: [TEST_COUPON_CODE] }));

        expect(result.Coupon?.CouponDiscountBreakdown).toEqual([
            { Name: PLANS.BUNDLE, Amount: -4200 },
            { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: -2400 },
        ]);
    });

    it('never overwrites a breakdown the backend already returned', () => {
        const backendBreakdown: CouponDiscountBreakdownBE = [{ Name: PLANS.BUNDLE, Amount: -1 }];
        const result = makeResult();
        result.Coupon = { ...result.Coupon!, CouponDiscountBreakdown: backendBreakdown };

        enrichMockCouponDiscountBreakdown(result, makeData());

        expect(result.Coupon?.CouponDiscountBreakdown).toBe(backendBreakdown);
    });

    it('is a no-op when the coupon does not match any static config', () => {
        const result = makeResult();

        enrichMockCouponDiscountBreakdown(result, makeData({ CouponCode: 'UNKNOWN_COUPON', Codes: undefined }));

        expect(result.Coupon?.CouponDiscountBreakdown).toBeUndefined();
    });

    it('is a no-op when there is no mock for the currency/cycle', () => {
        const result = makeResult({ Cycle: CYCLE.MONTHLY });

        enrichMockCouponDiscountBreakdown(result, makeData({ Cycle: CYCLE.MONTHLY }));

        expect(result.Coupon?.CouponDiscountBreakdown).toBeUndefined();
    });

    describe('hidden coupon without a mock breakdown', () => {
        const hiddenConfig = { hidden: true } as unknown as CouponConfig;

        // Hidden-coupon estimation for Duo + Lumo (USD, yearly): aggregate discount only, no per-line breakdown.
        const duoResult = (overrides: Partial<SubscriptionEstimation> = {}) =>
            makeResult({ Currency: 'USD', CouponDiscount: -3600, ...overrides });
        const duoData = (overrides: Partial<CheckSubscriptionData> = {}) => makeData({ Currency: 'USD', ...overrides });

        beforeEach(() => {
            jest.mocked(getStaticCouponConfig).mockImplementation((couponCode) =>
                couponCode === TEST_COUPON_CODE ? hiddenConfig : undefined
            );
        });

        it('attributes the entire discount to the base plan', () => {
            const result = duoResult();

            enrichMockCouponDiscountBreakdown(result, duoData({ Plans: { [PLANS.DUO]: 1 } }));

            expect(result.Coupon?.CouponDiscountBreakdown).toEqual([{ Name: PLANS.DUO, Amount: -3600 }]);
        });

        it('ignores addons in the request and only credits the base plan', () => {
            const result = duoResult();

            enrichMockCouponDiscountBreakdown(
                result,
                duoData({ Plans: { [PLANS.DUO]: 1, [ADDON_NAMES.LUMO_DUO]: 1 } })
            );

            expect(result.Coupon?.CouponDiscountBreakdown).toEqual([{ Name: PLANS.DUO, Amount: -3600 }]);
        });

        it('is a no-op when the request carries no base plan', () => {
            const result = duoResult();

            enrichMockCouponDiscountBreakdown(result, duoData({ Plans: { [ADDON_NAMES.LUMO_DUO]: 1 } }));

            expect(result.Coupon?.CouponDiscountBreakdown).toBeUndefined();
        });
    });
});
