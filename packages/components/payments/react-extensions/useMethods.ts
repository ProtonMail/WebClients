import { useEffect, useState } from 'react';

import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import { getPaymentMethods } from '@proton/payments/core/api/api';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { type ADDON_NAMES, PAYMENT_METHOD_TYPES, type PLANS } from '@proton/payments/core/constants';
import type {
    AvailablePaymentMethod,
    Currency,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentMethodType,
    PaymentStatus,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import type { PaymentMethodsContext } from '@proton/payments/core/payment-methods/paymentMethodAvailability';
import {
    getNewMethods,
    getUsedMethods,
    isMethodTypeEnabled,
} from '@proton/payments/core/payment-methods/paymentMethodAvailability';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isExistingPaymentMethod } from '@proton/payments/core/type-guards';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import type { Api, User } from '@proton/shared/lib/interfaces';

export type OnMethodChangedHandler = (method: AvailablePaymentMethod) => void;

export interface Props {
    amount: number;
    currency: Currency;
    coupon?: string | null;
    flow: PaymentMethodFlow;
    paymentStatus?: PaymentStatus;
    paymentMethods?: SavedPaymentMethod[];
    onMethodChanged?: OnMethodChangedHandler;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingAddress?: BillingAddress;
    enableSepa?: boolean;
    enableSepaB2C?: boolean;
    user?: User;
    planIDs?: PlanIDs;
    subscription?: Subscription | FreeSubscription;
    canUseApplePay?: boolean;
    canUseGooglePay?: boolean;
    isTrial?: boolean;
    enablePaypalRegionalCurrenciesBatch3: boolean;
    enablePaypalKrw: boolean;
    enableIdeal: boolean;
    sortNewMethods?: (methods: AvailablePaymentMethod[]) => AvailablePaymentMethod[];
}

interface Dependencies {
    api: Api;
    isAuthenticated: boolean;
}

export type MethodsHook = {
    loading: boolean;
    usedMethods: AvailablePaymentMethod[];
    newMethods: AvailablePaymentMethod[];
    allMethods: AvailablePaymentMethod[];
    lastUsedMethod: AvailablePaymentMethod | undefined;
    selectedMethod: AvailablePaymentMethod | undefined;
    savedSelectedMethod: SavedPaymentMethod | undefined;
    selectMethod: (id?: string) => AvailablePaymentMethod | undefined;
    getSavedMethodByID: (id: string | undefined) => SavedPaymentMethod | undefined;
    status: PaymentStatus | undefined;
    savedMethods: SavedPaymentMethod[] | undefined;
    isNewApplePay: boolean;
    isNewGooglePay: boolean;
    isMethodTypeEnabled: (methodType: PlainPaymentMethodType) => boolean;
};

type FetchedData = {
    // stays undefined when the request failed: there is nothing to offer without a status
    status?: PaymentStatus;
    savedMethods: SavedPaymentMethod[];
};

export const useMethods = (
    { paymentStatus, paymentMethods, coupon, onMethodChanged, sortNewMethods, ...props }: Props,
    { api, isAuthenticated }: Dependencies
): MethodsHook => {
    const [fetched, setFetched] = useState<FetchedData>();
    // undefined means "no explicit choice yet", null means "explicitly cleared"
    const [selectedValue, setSelectedValue] = useState<PaymentMethodType | null>();

    const getPaymentStatus = useGetPaymentStatus();

    useEffect(() => {
        const traceFailure = (error: unknown) =>
            tracePaymentError(error, {
                component: 'use-methods',
                subscription: props.subscription,
                tags: { flow: props.flow },
            });

        const fetchStatus = async () => {
            try {
                return paymentStatus ?? (await getPaymentStatus({ api }));
            } catch (error) {
                traceFailure(error);
                return undefined;
            }
        };

        const fetchSavedMethods = async () => {
            try {
                return paymentMethods ?? (isAuthenticated ? await getPaymentMethods(api) : []);
            } catch (error) {
                traceFailure(error);
                return [];
            }
        };

        void Promise.all([fetchStatus(), fetchSavedMethods()]).then(([status, savedMethods]) =>
            setFetched({ status, savedMethods })
        );
    }, []);

    const status = paymentStatus ?? fetched?.status;
    const savedMethods = paymentMethods ?? fetched?.savedMethods;

    const context: PaymentMethodsContext | undefined =
        status && savedMethods
            ? { ...props, coupon: coupon ?? '', paymentStatus: status, paymentMethods: savedMethods }
            : undefined;

    const usedMethods = context ? getUsedMethods(context) : [];
    const availableNewMethods = context ? getNewMethods(context) : [];
    const newMethods = context && sortNewMethods ? sortNewMethods(availableNewMethods) : availableNewMethods;
    const allMethods = [...usedMethods, ...newMethods];
    const lastUsedMethod = usedMethods[usedMethods.length - 1];

    let selectedMethod: AvailablePaymentMethod | undefined = undefined;

    if (selectedValue !== null) {
        selectedMethod = allMethods.find(({ value }) => value === selectedValue) ?? allMethods[0];
    }

    const getSavedMethodByID = (paymentMethodID: string | undefined): SavedPaymentMethod | undefined =>
        savedMethods?.find(({ ID }) => ID === paymentMethodID);

    const selectMethod = (id?: PaymentMethodType) => {
        if (!id) {
            setSelectedValue(null);
            return;
        }

        const method = allMethods.find(({ value }) => value === id);
        if (method) {
            if (method.value !== selectedMethod?.value) {
                onMethodChanged?.(method);
            }
            setSelectedValue(method.value);
        }

        return method;
    };

    useEffect(() => {
        if (!selectedMethod || selectedMethod.value === selectedValue) {
            return;
        }

        setSelectedValue(selectedMethod.value);
        if (selectedValue !== undefined) {
            onMethodChanged?.(selectedMethod);
        }
    }, [selectedMethod?.value]);

    const isNewApplePay =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.APPLE_PAY && !isExistingPaymentMethod(selectedMethod.value);

    const isNewGooglePay =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.GOOGLE_PAY && !isExistingPaymentMethod(selectedMethod.value);

    return {
        selectedMethod,
        savedSelectedMethod: getSavedMethodByID(selectedMethod?.value),
        selectMethod,
        loading: !fetched,
        usedMethods,
        newMethods,
        allMethods,
        lastUsedMethod,
        getSavedMethodByID,
        status,
        savedMethods,
        isNewApplePay,
        isNewGooglePay,
        isMethodTypeEnabled: (methodType) => (context ? isMethodTypeEnabled(context, methodType) : false),
    };
};
