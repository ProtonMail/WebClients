import { type SearchParamStringOptions, getSearchParamString } from '@proton/utils/searchParams';

import { type ADDON_GENERIC_NAME, ADDON_GENERIC_NAMES, type COUPON_CODES, CURRENCIES, type PLANS } from '../constants';
import type { Currency } from '../interface';
import { correctDeprecatedPlanName } from '../plan/helpers';
import { getValidCycle } from './helpers';

type TotalParams = Partial<Record<`total${ADDON_GENERIC_NAME}`, number>>;
type SubscriptionSearchParamsBase = {
    /** Any coupon code; enum values get autocomplete, arbitrary strings are allowed */
    coupon?: COUPON_CODES | (string & {});
    minimumCycle?: number;
    maximumCycle?: number;
    currency?: Currency;
    upsellRef?: string;
    /**
     * disallow the user to change the cycle via UI
     */
    fixedCycle?: true;
    /**
     * disallow the user to change the plan via UI
     */
    fixedPlan?: true;
    /**
     * @deprecated use fixedPlan=true
     */
    edit?: 'enable' | 'disable';
    /**
     * @deprecated use fixedCycle=true && fixedPlan=true
     */
    type?: 'offer';
    /**
     * @deprecated use fixedCycle=true
     */
    offer?: true;
    /**
     * @deprecated use totalLumo or totalMeet instead
     */
    addon?: 'lumo' | 'meet';
};

type SubscriptionSearchParamsCycle =
    | {
          /**
           * @deprecated use cycle
           */
          billing: number;
          cycle?: never;
      }
    | {
          /**
           * @deprecated use cycle
           */
          billing?: never;
          cycle?: number;
      };

type SubscriptionSearchParamsTarget = { target?: 'compare'; plan?: PLANS } | { target: 'checkout'; plan: PLANS };

export type SubscriptionSearchParams = SubscriptionSearchParamsBase &
    SubscriptionSearchParamsCycle &
    SubscriptionSearchParamsTarget &
    TotalParams;

const TOTAL_ADDON_KEYS = Object.values(ADDON_GENERIC_NAMES).map((addon) => `total${addon}`);

const getTotalParams = (params: URLSearchParams): TotalParams =>
    TOTAL_ADDON_KEYS.reduce((result, key) => {
        const total = Math.floor(Number(params.get(key)));

        return total > 0 ? { ...result, [key]: total } : result;
    }, {});

/**
 * Parses subscription search params used in modals and pages into a normalized object.
 *
 * Reads `coupon` (any string), resolves `plan` via `correctDeprecatedPlanName`, and maps
 * legacy `type`, `edit`, and `offer` params to `fixedPlan` / `fixedCycle`.
 * `total*` addon counts are only read when `plan` is set; `addon=lumo|meet` without
 * `plan` still sets `totalLumo` / `totalMeet` for the deprecated expansion flow.
 * `target=checkout` without a valid `plan` is ignored (`target` comes back `undefined`).
 *
 * @example
 * extractSubscriptionSearchParams('?plan=mail2022&cycle=24&fixedPlan=true&totalMember=2')
 * // => { plan: 'mail2022', cycle: 24, fixedPlan: true, totalMember: 2 }
 *
 * @example
 * extractSubscriptionSearchParams('?addon=lumo')
 * // => { totalLumo: 1 }
 */
export const extractSubscriptionSearchParams = (
    search: string | URLSearchParams
): Omit<SubscriptionSearchParams, 'billing' | 'addon' | 'edit' | 'type' | 'offer'> => {
    const params = new URLSearchParams(search);

    const coupon = params.get('coupon') || undefined;

    const rawFixedPlan = params.has('fixedPlan');
    const rawFixedCycle = params.has('fixedCycle');
    const rawEdit = params.get('edit');
    const edit = ['enable', 'disable'].find((e) => e === rawEdit) ?? undefined;
    const offer = params.has('offer');
    const typeOffer = params.get('type') === 'offer';
    const fixedPlan = rawFixedPlan || typeOffer || edit === 'disable' || undefined;
    const fixedCycle = rawFixedCycle || (edit !== 'enable' && (typeOffer || offer)) || undefined;

    const minimumCycle = getValidCycle(Number(params.get('minimumCycle')));
    const maximumCycle = getValidCycle(Number(params.get('maximumCycle')));

    const rawCurrency = params.get('currency');
    const currency = Object.values(CURRENCIES).find((c) => c === rawCurrency?.toUpperCase()) ?? undefined;

    const cycle = getValidCycle(Number(params.get('cycle')) || Number(params.get('billing')));

    const rawPlan = params.get('plan');
    const plan = correctDeprecatedPlanName(rawPlan) as PLANS | undefined;

    const upsellRef = params.get('upsellRef') || undefined;

    const totals = plan ? getTotalParams(params) : {};

    if (!plan) {
        const addon = params.get('addon');
        switch (addon) {
            case 'lumo':
                totals.totalLumo = 1;
                break;
            case 'meet':
                totals.totalMeet = 1;
                break;
            default:
        }
    }

    const partialParams = {
        coupon,
        fixedPlan,
        fixedCycle,
        minimumCycle,
        maximumCycle,
        currency,
        cycle,
        upsellRef,
        ...totals,
    };

    const rawTarget = params.get('target');
    const target = (['checkout', 'compare'].find((t) => t === rawTarget) ?? undefined) as
        'checkout' | 'compare' | undefined;

    // on target=checkout plan needs to be defined; otherwise the default step applies
    if (target === 'checkout' && !plan) {
        return { ...partialParams, target: undefined, plan };
    }

    return { ...partialParams, target, plan };
};

/**
 * Builds a subscription search params query string from typed {@link SubscriptionSearchParams}.
 *
 * Normalizes the same fields as {@link extractSubscriptionSearchParams}, maps deprecated
 * `type`, `edit`, `offer`, and `billing` inputs to their canonical equivalents, and
 * omits totals when no `plan` is set, except for deprecated `addon=lumo|meet` expansion.
 *
 * @throws When `target` is `checkout` and no valid `plan` is provided.
 *
 * @example
 * getSubscriptionSearchParamsString({ plan: 'mail2022', cycle: 12, fixedPlan: true })
 * // => 'plan=mail2022&cycle=12&fixedPlan=true'
 *
 * @example
 * const search = getSubscriptionSearchParamsString({ plan: 'mail2022', totalMember: 3 })
 * history.push(`/dashboard?${search}`)
 */
export const getSubscriptionSearchParamsString = (
    params: SubscriptionSearchParams & Record<string, any>,
    getSearchParamsStringOptions: SearchParamStringOptions = { multiple: 'comma-separated' }
): string => {
    const {
        coupon,
        fixedPlan,
        fixedCycle,
        minimumCycle,
        maximumCycle,
        currency,
        cycle,
        target,
        plan: rawPlan,
        upsellRef,
        // deprecated
        edit,
        type,
        offer,
        addon,
        billing,
        ...othersAndTotals
    } = params;

    const [definedTotals, others] = Object.entries(othersAndTotals).reduce<[TotalParams, Record<string, any>]>(
        ([prevTotals, prevOthers], [key, value]) => {
            if (TOTAL_ADDON_KEYS.includes(key)) {
                return [
                    {
                        ...prevTotals,
                        [key]: value,
                    },
                    prevOthers,
                ];
            }
            return [prevTotals, { ...prevOthers, [key]: value }];
        },
        [{}, {}]
    );

    const plan = correctDeprecatedPlanName(rawPlan);

    if (target === 'checkout') {
        if (!plan) {
            throw new Error(`target: 'checkout' can't be set without plan`);
        }
    }

    const totals = plan ? definedTotals : {};

    /**
     * As addon deprecated will be only take into consideration if plan is not set.
     * For setting plan and addons we need to use totalLumo and totalMeet
     */
    if (!plan) {
        switch (addon) {
            case 'lumo':
                totals.totalLumo = 1;
                break;
            case 'meet':
                totals.totalMeet = 1;
                break;
            default:
        }
    }

    const polishedParams = {
        coupon,
        fixedPlan: fixedPlan || type === 'offer' || edit === 'disable' || undefined,
        fixedCycle: fixedCycle || (edit !== 'enable' && (type === 'offer' || offer)) || undefined,
        minimumCycle,
        maximumCycle,
        upsellRef,
        currency: Object.values(CURRENCIES).find((c) => c === currency?.toUpperCase()),
        cycle: getValidCycle(Number(cycle) || Number(billing)),
        target,
        plan,
        ...totals,
    };

    return getSearchParamString({ ...others, ...polishedParams }, getSearchParamsStringOptions);
};
