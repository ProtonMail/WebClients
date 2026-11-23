import {
    type PayloadAction,
    type ThunkAction,
    type ThunkDispatch,
    type UnknownAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import { type QueryPlansParams, getFreePlan, queryPlans } from '@proton/payments/core/api/api';
import { CURRENCIES } from '@proton/payments/core/constants';
import {
    getDefaultMainCurrency,
    getSupportedRegionalCurrencies,
    isRegionalCurrency,
} from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import { toSubscriptionList } from '@proton/payments/core/subscription/multi-subscription-context';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import {
    cacheHelper,
    createPromiseMapStore,
    createPromiseStore,
    getIsStaleRefetch,
} from '@proton/redux-utilities/promiseStore';
import { DAY } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';

import { type PaymentStatusState, paymentStatusThunk } from '../paymentStatus';
import { type SubscriptionState, subscriptionThunk } from '../subscription';
import { type UserState, selectUser } from '../user';

const name = 'plans' as const;
const plansWithOfferName = 'plansWithOffer' as const;

export interface PlansState extends PaymentStatusState, UserState, SubscriptionState {
    [name]: ModelState<{ plans: Plan[]; freePlan: FreePlanDefault }>;
    [plansWithOfferName]: { [key: string]: ModelState<{ plans: Plan[]; freePlan: FreePlanDefault }> | undefined };
}

type SliceState = PlansState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPlans = (state: PlansState) => state.plans;

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<Model>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
    },
});

const plansWithOfferInitialState: PlansState[typeof plansWithOfferName] = {};

const plansWithOfferSlice = createSlice({
    name: plansWithOfferName,
    initialState: plansWithOfferInitialState,
    reducers: {
        pending: (state, action: PayloadAction<{ key: string }>) => {
            const entry = state[action.payload.key];
            if (entry) {
                entry.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ key: string; value: Model }>) => {
            state[action.payload.key] = {
                value: action.payload.value,
                error: undefined,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: getFetchedEphemeral() },
            };
        },
        rejected: (state, action: PayloadAction<{ key: string; error: any }>) => {
            const entry = state[action.payload.key];
            state[action.payload.key] = {
                value: entry?.value,
                error: action.payload.error,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: entry?.meta.fetchedEphemeral },
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(slice.actions.fulfilled, () => plansWithOfferInitialState);
    },
});

const promiseStore = createPromiseStore<Model>();
const plansWithOfferPromiseStore = createPromiseMapStore<Model>();
const previous = previousSelector(selectPlans);

type PlansDispatch = ThunkDispatch<PlansState, ProtonThunkArguments, UnknownAction>;

const getRegionalCurrencies = async ({
    dispatch,
    getState,
    api,
}: {
    dispatch: PlansDispatch;
    getState: () => PlansState;
    api?: Api;
}): Promise<{
    regionalCurrencies: Currency[];
    defaultMainCurrency: Currency;
}> => {
    const user = selectUser(getState())?.value;

    const [status, subscription] = await Promise.all([
        dispatch(paymentStatusThunk({ api: api ? api : undefined })),
        user ? dispatch(subscriptionThunk()) : undefined,
    ]);

    const regionalCurrencies = getSupportedRegionalCurrencies({
        paymentStatus: status,
        user,
        subscriptions: toSubscriptionList(subscription),
    });

    return {
        regionalCurrencies,
        defaultMainCurrency: getDefaultMainCurrency(status),
    };
};

const thunk = ({
    api: apiOverride,
}: {
    api?: Api;
} = {}): ThunkAction<Promise<Model>, PlansState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument });
        };
        const cb = async () => {
            try {
                // Step 1: load the plans without any parameters. It can return either main currency or a regional one.
                // In addition, we fetch the regional currencies that are available for the user

                dispatch(slice.actions.pending());

                const api = apiOverride ?? extraArgument.api;
                const plansPromise: Promise<Plan[]> = api<{ Plans: Plan[] }>(queryPlans()).then(({ Plans }) => Plans);

                const [plansResult, freePlan, { regionalCurrencies, defaultMainCurrency }] = await Promise.all([
                    plansPromise,
                    getFreePlan({ api }),
                    getRegionalCurrencies({ dispatch, getState, api: apiOverride }),
                ]);

                // Step 2: if some required currencies are missing, then we fetch them separately
                // if the regional currencis were not loaded initially, then that's the second chance to load them
                const missingCurrencies = regionalCurrencies.filter(
                    (currency) => !plansResult.some((plan) => plan.Currency === currency)
                );

                // in case if after the initial plans fetch we still don't have any main currency, then we fetch the
                // plans with the main currency and add them to the list
                const hasMainCurrency = plansResult.some((plan) => !isRegionalCurrency(plan.Currency));
                if (!hasMainCurrency) {
                    missingCurrencies.push(defaultMainCurrency);
                }

                const missingPlans: Plan[] = (
                    await Promise.all(
                        missingCurrencies.map((currency) =>
                            api<{ Plans: Plan[] }>(queryPlans({ Currency: currency })).then(({ Plans }) => Plans)
                        )
                    )
                ).flat();

                plansResult.push(...missingPlans);

                // Step 3
                // the main currencies have the same price points, so if we already have a plan in the main currency
                // then we can synthetically create the same plan in the other main currencies
                const existingMainCurrencies = [
                    ...new Set(
                        plansResult.map((plan) => plan.Currency).filter((currency) => !isRegionalCurrency(currency))
                    ),
                ];

                const missingMainCurrencies = CURRENCIES.filter(
                    (currency) => !isRegionalCurrency(currency) && !existingMainCurrencies.includes(currency)
                );

                if (existingMainCurrencies.length > 0 && missingMainCurrencies.length > 0) {
                    const mainCurrency = existingMainCurrencies[0];
                    const existingMainPlans = plansResult.filter((plan) => plan.Currency === mainCurrency);

                    for (const missingCurrency of missingMainCurrencies) {
                        const missingPlans = existingMainPlans.map((plan) => {
                            return {
                                ...plan,
                                Currency: missingCurrency,
                            };
                        });
                        plansResult.push(...missingPlans);
                    }
                }

                // Step 4
                // We need to merge the new plans with the existing plans
                const isSamePlan = (plan1: Plan, plan2: Plan) => {
                    return plan1.Name === plan2.Name && plan1.Currency === plan2.Currency;
                };

                const currentPlansState = select();
                // This ignores persisted values. This ensures that if the API removes a plan, we don't keep it forever in the cache.
                const currentPlans =
                    (getIsStaleRefetch(currentPlansState?.meta.fetchedEphemeral, CacheType.StaleRefetch)
                        ? undefined
                        : currentPlansState?.value?.plans) ?? [];

                // if the plan already exists then we replace it with the new one if it's available
                const updatedPlans = currentPlans.map((existingPlan) => {
                    const updatedPlan = plansResult.find((newPlan) => isSamePlan(newPlan, existingPlan));
                    return updatedPlan ?? existingPlan;
                });

                // if plan doesn't exist yet, then we add it to the array
                const newPlans = plansResult.filter(
                    (newPlan) => !currentPlans.some((existingPlan) => isSamePlan(existingPlan, newPlan))
                );

                const plans: Plan[] = [...updatedPlans, ...newPlans];

                const value = {
                    plans,
                    freePlan,
                };

                dispatch(slice.actions.fulfilled(value));
                return value;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };

        return cacheHelper({ store: promiseStore, select, cb, expiry: DAY });
    };
};

/**
 * Loads the plans priced with a private offer and keeps them apart from the regular plans, one entry per offer and
 * set of subscriptions. An offer has its own price for each currency, so each main currency is requested.
 */
const plansWithOfferThunk = ({
    offer,
    api: apiOverride,
    cache,
}: {
    offer: string;
    api?: Api;
    cache?: CacheType;
}): ThunkAction<Promise<Model>, PlansState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extraArgument) => {
        const subscription = selectUser(getState())?.value ? await dispatch(subscriptionThunk()) : undefined;
        const key = [
            offer.toLowerCase(),
            ...toSubscriptionList(subscription).flatMap(({ Plans, Cycle, Currency, PeriodEnd }) => [
                Plans?.map((plan) => plan.Name).join(','),
                Cycle,
                Currency,
                PeriodEnd,
            ]),
        ].join(':');

        const select = () => getState()[plansWithOfferName][key];

        const cb = async () => {
            try {
                dispatch(plansWithOfferSlice.actions.pending({ key }));

                const api = apiOverride ?? extraArgument.api;
                const getPlans = (params?: QueryPlansParams) =>
                    api<{ Plans: Plan[] }>(queryPlans({ ...params, Offer: offer })).then(({ Plans }) => Plans);

                const [plans, freePlan, { regionalCurrencies }] = await Promise.all([
                    getPlans(),
                    getFreePlan({ api }),
                    getRegionalCurrencies({ dispatch, getState, api: apiOverride }),
                ]);

                const mainCurrencies = CURRENCIES.filter((currency) => !isRegionalCurrency(currency));
                const missingCurrencies = [...new Set([...regionalCurrencies, ...mainCurrencies])].filter(
                    (currency) => !plans.some((plan) => plan.Currency === currency)
                );
                const missingPlans = await Promise.all(
                    missingCurrencies.map((currency) => getPlans({ Currency: currency }))
                );

                const value = { plans: [...plans, ...missingPlans.flat()], freePlan };

                dispatch(plansWithOfferSlice.actions.fulfilled({ key, value }));
                return value;
            } catch (error) {
                dispatch(plansWithOfferSlice.actions.rejected({ key, error: miniSerializeError(error) }));
                throw error;
            }
        };

        return cacheHelper({ store: plansWithOfferPromiseStore, key, select, cb, cache, expiry: DAY });
    };
};

/**
 * Picks the thunk that loads the plans: the ones priced with the private `offer` when there is one. `cache` only
 * applies to those, for example `CacheType.None` to load them again.
 */
export const getPlansThunk = ({ offer, api, cache }: { offer?: string; api?: Api; cache?: CacheType } = {}) => {
    const offerName = offer?.trim();
    return offerName ? plansWithOfferThunk({ offer: offerName, api, cache }) : thunk({ api });
};

export const plansReducer = { [name]: slice.reducer, [plansWithOfferName]: plansWithOfferSlice.reducer };
export const plansThunk = thunk;
