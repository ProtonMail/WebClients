import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { getAvailableCurrencies, isRegionalCurrency } from '@proton/components/payments/core/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { getFreePlan, queryPlans } from '@proton/shared/lib/api/payments';
import { CURRENCIES, DAY, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import type { Api, Currency, FreePlanDefault, Plan } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type PaymentStatusState, paymentStatusThunk } from '../paymentStatus';
import { type SubscriptionState, subscriptionThunk } from '../subscription';
import { type UserState, selectUser } from '../user';

const name = 'plans' as const;

export interface PlansState extends PaymentStatusState, UserState, SubscriptionState {
    [name]: ModelState<{ plans: Plan[]; freePlan: FreePlanDefault }>;
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
        },
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectPlans);

const thunk = ({
    api: apiOverride,
}: {
    api?: Api;
} = {}): ThunkAction<Promise<Model>, PlansState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const getRegionalCurrencies: () => Promise<Currency[]> = async () => {
            const user = selectUser(getState()).value;

            const [status, subscription] = await Promise.all([
                dispatch(paymentStatusThunk({ api: apiOverride ? apiOverride : undefined })),
                user ? dispatch(subscriptionThunk()) : undefined,
            ]);

            const availableCurrencies = getAvailableCurrencies({
                status,
                user,
                subscription,
                regionalCurrenciesEnabled: true,
            });

            return availableCurrencies.filter((currency) => isRegionalCurrency(currency));
        };

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

                const [plansResult, freePlan, regionalCurrencies] = await Promise.all([
                    plansPromise,
                    getFreePlan({ api }),
                    getRegionalCurrencies(),
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
                    missingCurrencies.push(DEFAULT_CURRENCY);
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

                const syntheticPlans: Plan[] = plansResult;

                if (existingMainCurrencies.length > 0 && missingMainCurrencies.length > 0) {
                    const mainCurrency = existingMainCurrencies[0];
                    const existingMainPlans = syntheticPlans.filter((plan) => plan.Currency === mainCurrency);

                    for (const missingCurrency of missingMainCurrencies) {
                        const missingPlans = existingMainPlans.map((plan) => {
                            return {
                                ...plan,
                                Currency: missingCurrency,
                            };
                        });
                        syntheticPlans.push(...missingPlans);
                    }
                }

                // Step 4
                // We need to merge the new plans with the existing plans
                const isSamePlan = (plan1: Plan, plan2: Plan) => {
                    return plan1.Name === plan2.Name && plan1.Currency === plan2.Currency;
                };

                const currentPlans = select()?.value?.plans ?? [];

                // if the plan already exists then we replace it with the new one if it's available
                const updatedPlans = currentPlans.map((existingPlan) => {
                    const updatedPlan = syntheticPlans.find((newPlan) => isSamePlan(newPlan, existingPlan));
                    return updatedPlan ?? existingPlan;
                });

                // if plan doesn't exist yet, then we add it to the array
                const newPlans = syntheticPlans.filter(
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

export const plansReducer = { [name]: slice.reducer };
export const plansThunk = thunk;
