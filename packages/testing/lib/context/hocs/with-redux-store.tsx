import type { ComponentType } from 'react';

import { getModelState } from '@proton/account/tests';
import type { Entitlements } from '@proton/payments/core/entitlements/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import type { ApiEnvironmentConfig, CachedOrganizationKey, UserModel } from '@proton/shared/lib/interfaces';
import { makeEntitlements } from '@proton/testing/builders/entitlements';
import { buildUser } from '@proton/testing/builders/user';

import { getOrganizationState, getPaymentStatusState, getSubscriptionState } from '../../initialReduxState';
import { type RootState, setupStore } from '../store';

type ReduxModelOverrides = Partial<{
    user: UserModel;
    plans: Plan[];
    entitlements: Entitlements;
}>;

export type WithReduxStoreProps = {
    preloadedState?: Partial<RootState>;
    store?: ReturnType<typeof setupStore>;
} & ReduxModelOverrides;

export const getPreloadedState = (
    stateOverrides: Partial<RootState> = {},
    modelOverrides: ReduxModelOverrides = {}
) => ({
    user: getModelState(modelOverrides.user ?? buildUser()),
    addresses: getModelState([]),
    addressKeys: {},
    contacts: getModelState([]),
    categories: getModelState([]),
    contactEmails: getModelState([]),
    subscription: getSubscriptionState(),
    paymentStatus: getPaymentStatusState({
        CountryCode: 'CH',
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
            Google: true,
            Ideal: true,
        },
    }),
    organization: getOrganizationState(),
    organizationKey: getModelState({} as CachedOrganizationKey),
    userInvitations: getModelState([]),
    plans: getModelState({ plans: modelOverrides.plans ?? [], freePlan: FREE_PLAN }),
    entitlements: getModelState(modelOverrides.entitlements ?? makeEntitlements()),
    features: {},
    importerConfig: getModelState({} as ApiEnvironmentConfig),
    ...stateOverrides,
});

export const withReduxStore =
    (props: WithReduxStoreProps = {}) =>
    <T extends {}>(Component: ComponentType<T>) => {
        const store =
            props.store ??
            setupStore({
                preloadedState: getPreloadedState(props.preloadedState, props),
            });

        const ReduxStoreHoc = (props: T & JSX.IntrinsicAttributes) => {
            return (
                <ProtonStoreProvider store={store}>
                    <Component {...props} />
                </ProtonStoreProvider>
            );
        };

        ReduxStoreHoc.displayName = `withReduxStore(${Component.displayName || Component.name})`;

        return ReduxStoreHoc;
    };
