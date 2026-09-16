import { COUPON_CODES, CYCLE, PLANS } from '../constants';
import { extractSubscriptionSearchParams, getSubscriptionSearchParamsString } from './search-params';

describe('extractSubscriptionSearchParams', () => {
    it('parses plan, cycle, coupon, and currency', () => {
        const result = extractSubscriptionSearchParams(
            `?plan=mail2022&cycle=24&coupon=${COUPON_CODES.BLACK_FRIDAY_2025}&currency=eur`
        );

        expect(result.plan).toBe(PLANS.MAIL);
        expect(result.cycle).toBe(CYCLE.TWO_YEARS);
        expect(result.coupon).toBe(COUPON_CODES.BLACK_FRIDAY_2025);
        expect(result.currency).toBe('EUR');
    });

    it('maps fixedPlan and fixedCycle from URL flags', () => {
        const result = extractSubscriptionSearchParams('?plan=mail2022&fixedPlan&fixedCycle');

        expect(result.fixedPlan).toBe(true);
        expect(result.fixedCycle).toBe(true);
    });

    it('maps legacy type, edit, and offer params', () => {
        expect(extractSubscriptionSearchParams('?plan=mail2022&type=offer').fixedPlan).toBe(true);
        expect(extractSubscriptionSearchParams('?plan=mail2022&type=offer').fixedCycle).toBe(true);
        expect(extractSubscriptionSearchParams('?plan=mail2022&edit=disable').fixedPlan).toBe(true);
        expect(extractSubscriptionSearchParams('?plan=mail2022&offer=anything').fixedCycle).toBe(true);
        expect(extractSubscriptionSearchParams('?plan=mail2022&type=offer&edit=enable').fixedCycle).toBeUndefined();
    });

    it('passes an unknown coupon through', () => {
        expect(extractSubscriptionSearchParams('?plan=mail2022&coupon=PARTNER-SUMMER-27').coupon).toBe(
            'PARTNER-SUMMER-27'
        );
    });

    it('reads totalMember only when plan is set', () => {
        expect(extractSubscriptionSearchParams('?totalMember=5').totalMember).toBeUndefined();
        expect(extractSubscriptionSearchParams('?plan=mail2022&totalMember=5').totalMember).toBe(5);
    });

    it('ignores target=checkout when plan is missing', () => {
        const result = extractSubscriptionSearchParams('?target=checkout');

        expect(result.target).toBeUndefined();
        expect(result.plan).toBeFalsy();
    });

    it('ignores target=checkout when plan is empty', () => {
        const result = extractSubscriptionSearchParams('?target=checkout&plan=');

        expect(result.target).toBeUndefined();
        expect(result.plan).toBeFalsy();
    });

    it('reads upsellRef and treats empty as unset', () => {
        expect(extractSubscriptionSearchParams('?plan=mail2022&upsellRef=onboarding_banner').upsellRef).toBe(
            'onboarding_banner'
        );
        expect(extractSubscriptionSearchParams('?plan=mail2022&upsellRef=').upsellRef).toBeUndefined();
    });

    it('keeps target=checkout when plan is set', () => {
        expect(extractSubscriptionSearchParams('?plan=mail2022&target=checkout')).toMatchObject({
            plan: PLANS.MAIL,
            target: 'checkout',
        });
    });
});

describe('getSubscriptionSearchParamsString', () => {
    it('builds a query string with canonical params', () => {
        const search = getSubscriptionSearchParamsString({
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            coupon: COUPON_CODES.BLACK_FRIDAY_2025,
            currency: 'EUR',
            fixedPlan: true,
            target: 'checkout',
        });
        const params = new URLSearchParams(search);

        expect(params.get('plan')).toBe('mail2022');
        expect(params.get('cycle')).toBe('12');
        expect(params.get('coupon')).toBe(COUPON_CODES.BLACK_FRIDAY_2025);
        expect(params.get('currency')).toBe('EUR');
        expect(params.get('fixedPlan')).toBe('true');
        expect(params.get('target')).toBe('checkout');
        expect(params.get('upsellRef')).toBeNull();
    });

    it('emits upsellRef', () => {
        const params = new URLSearchParams(
            getSubscriptionSearchParamsString({ plan: PLANS.MAIL, upsellRef: 'onboarding_banner' })
        );

        expect(params.get('upsellRef')).toBe('onboarding_banner');
    });

    it('includes totals when plan is set', () => {
        const params = new URLSearchParams(
            getSubscriptionSearchParamsString({
                plan: PLANS.MAIL,
                totalMember: 3,
            })
        );

        expect(params.get('totalMember')).toBe('3');
    });

    it('emits an unknown coupon', () => {
        const params = new URLSearchParams(
            getSubscriptionSearchParamsString({ plan: PLANS.MAIL, coupon: 'PARTNER-SUMMER-27' })
        );

        expect(params.get('coupon')).toBe('PARTNER-SUMMER-27');
    });

    it('maps deprecated params to fixedPlan and fixedCycle', () => {
        const params = new URLSearchParams(
            getSubscriptionSearchParamsString({
                plan: PLANS.MAIL,
                type: 'offer',
                edit: 'enable',
            })
        );

        expect(params.get('fixedPlan')).toBe('true');
        expect(params.get('fixedCycle')).toBeNull();
    });

    it('maps deprecated addon=lumo without plan', () => {
        const params = new URLSearchParams(getSubscriptionSearchParamsString({ addon: 'lumo' }));

        expect(params.get('totalLumo')).toBe('1');
        expect(params.get('plan')).toBeNull();
    });

    it('throws when target=checkout has no plan', () => {
        expect(() => getSubscriptionSearchParamsString({ target: 'checkout' } as any)).toThrow(
            "target: 'checkout' can't be set without plan"
        );
    });
});

describe('extractSubscriptionSearchParams and getSubscriptionSearchParamsString', () => {
    it('rebuilds a legacy URL into canonical params', () => {
        const parsed = extractSubscriptionSearchParams(
            `?plan=mail2022&type=offer&edit=enable&cycle=12&coupon=${COUPON_CODES.BLACK_FRIDAY_2025}&totalMember=2&upsellRef=onboarding_banner`
        );
        const reparsed = extractSubscriptionSearchParams(getSubscriptionSearchParamsString(parsed as any));

        expect(reparsed).toEqual(parsed);
    });

    it('keeps the same query string after build and parse', () => {
        const search = getSubscriptionSearchParamsString({
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            fixedPlan: true,
            fixedCycle: true,
            totalMember: 2,
        });
        const rebuilt = getSubscriptionSearchParamsString(extractSubscriptionSearchParams(search) as any);

        expect(rebuilt).toBe(search);
    });
});
