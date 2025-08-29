import { useEffect, useRef, useState } from 'react';

import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import type {
    AvailablePaymentMethod,
    BillingAddress,
    PaymentMethodFlow,
    PaymentMethodType,
    PaymentMethods,
    PaymentStatus,
    PaymentsApi,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '@proton/payments';
import {
    type ADDON_NAMES,
    type Currency,
    PAYMENT_METHOD_TYPES,
    type PLANS,
    type Subscription,
    initializePaymentMethods,
    isExistingPaymentMethod,
    isSavedPaymentMethodExternal,
    isSavedPaymentMethodInternal,
} from '@proton/payments';
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
    paymentsApi: PaymentsApi;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingAddress?: BillingAddress;
    enableSepa?: boolean;
    enableSepaB2C?: boolean;
    user?: User;
    planIDs?: PlanIDs;
    subscription?: Subscription;
    canUseApplePay?: boolean;
    isTrial?: boolean;
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
    savedInternalSelectedMethod: SavedPaymentMethodInternal | undefined;
    savedExternalSelectedMethod: SavedPaymentMethodExternal | undefined;
    savedSelectedMethod: SavedPaymentMethod | undefined;
    selectMethod: (id?: string) => AvailablePaymentMethod | undefined;
    getSavedMethodByID: (id: string | undefined) => SavedPaymentMethod | undefined;
    status: PaymentStatus | undefined;
    savedMethods: SavedPaymentMethod[] | undefined;
    isNewPaypal: boolean;
    isNewApplePay: boolean;
    isMethodTypeEnabled: (methodType: PlainPaymentMethodType) => boolean;
};

type UsedAndNewMethods = {
    usedMethods: AvailablePaymentMethod[];
    newMethods: AvailablePaymentMethod[];
};

// todo: refactor this component and potentially get rid of the binding to a PaymentMethods class
export const useMethods = (
    {
        paymentStatus,
        paymentMethods,
        amount,
        currency,
        coupon,
        flow,
        onMethodChanged,
        paymentsApi,
        selectedPlanName,
        billingAddress,
        enableSepa,
        enableSepaB2C,
        user,
        planIDs,
        subscription,
        canUseApplePay,
        isTrial,
    }: Props,
    { api, isAuthenticated }: Dependencies
): MethodsHook => {
    const paymentMethodsRef = useRef<PaymentMethods>();
    const pendingDataRef = useRef<{
        pendingAmount?: number;
        pendingCurrency?: Currency;
        pendingCoupon?: string | null;
        pendingFlow?: PaymentMethodFlow;
        pendingSelectedPlanName?: PLANS | ADDON_NAMES;
        pendingBillingAddress?: BillingAddress;
        pendingEnableSepa?: boolean;
        pendingEnableSepaB2C?: boolean;
        pendingUser?: User;
        pendingPlanIDs?: PlanIDs;
        pendingSubscription?: Subscription;
        pendingPaymentStatus?: PaymentStatus;
        pendingCanUseApplePay?: boolean;
        pendingIsTrial?: boolean;
    }>();

    const [loading, setLoading] = useState(true);
    const [availableMethods, setAvailableMethods] = useState<UsedAndNewMethods>({
        usedMethods: [],
        newMethods: [],
    });
    const [selectedMethod, setSelectedMethod] = useState<AvailablePaymentMethod | undefined>();

    const [status, setStatus] = useState<PaymentStatus | undefined>(paymentStatus);
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[] | undefined>();

    const getPaymentStatus = useGetPaymentStatus();

    const getComputedMethods = (availableMethodsParam?: UsedAndNewMethods) => {
        const { usedMethods, newMethods } = availableMethodsParam ?? availableMethods;
        const allMethods = [...usedMethods, ...newMethods];
        const lastUsedMethod = usedMethods[usedMethods.length - 1];

        return {
            allMethods,
            lastUsedMethod,
            usedMethods,
            newMethods,
        };
    };

    const updateMethods = () => {
        const { usedMethods, methods: newMethods } = paymentMethodsRef.current!.getAvailablePaymentMethods();

        const result = {
            usedMethods,
            newMethods,
        };
        setAvailableMethods(result);
        return result;
    };

    useEffect(() => {
        async function run() {
            const paymentStatusDefined = paymentStatus ?? (await getPaymentStatus({ api }));

            paymentMethodsRef.current = await initializePaymentMethods({
                api,
                maybePaymentMethodStatus: paymentStatusDefined,
                maybePaymentMethods: paymentMethods,
                isAuthenticated,
                amount,
                currency,
                coupon: coupon ?? '',
                flow,
                paymentsApi,
                selectedPlanName,
                billingAddress,
                enableSepa,
                enableSepaB2C,
                user,
                planIDs,
                subscription,
                canUseApplePay,
                isTrial,
            });

            // Initialization might take some time, so we need to check if there is any pending data
            // If for example the amount changes before initialization is done, then it won't be updated by the usual
            // useEffect handler below. In this case we need to update the amount manually.
            // Same goes for coupon and flow.
            if (pendingDataRef.current) {
                // Getting the saved values and clearing the pending right away, because this is a one-time thing
                const {
                    pendingAmount,
                    pendingCurrency,
                    pendingCoupon,
                    pendingFlow,
                    pendingSelectedPlanName,
                    pendingBillingAddress,
                    pendingEnableSepa,
                    pendingEnableSepaB2C,
                    pendingUser,
                    pendingPlanIDs,
                    pendingSubscription,
                    pendingPaymentStatus: pendingPaymentExtended,
                    pendingCanUseApplePay,
                    pendingIsTrial,
                } = pendingDataRef.current;
                pendingDataRef.current = undefined;

                // Updating the coupon
                paymentMethodsRef.current.coupon = pendingCoupon ?? '';

                // Updating the amount
                if (typeof pendingAmount === 'number') {
                    paymentMethodsRef.current.amount = pendingAmount;
                }

                // Updating the currency
                if (pendingCurrency) {
                    paymentMethodsRef.current.currency = pendingCurrency;
                }

                // Updating the flow
                if (pendingFlow) {
                    paymentMethodsRef.current.flow = pendingFlow;
                }

                if (pendingSelectedPlanName) {
                    paymentMethodsRef.current.selectedPlanName = pendingSelectedPlanName;
                }

                if (pendingBillingAddress !== undefined) {
                    paymentMethodsRef.current.billingAddress = pendingBillingAddress;
                }

                if (pendingEnableSepa !== undefined) {
                    paymentMethodsRef.current.enableSepa = pendingEnableSepa;
                }

                if (pendingEnableSepaB2C !== undefined) {
                    paymentMethodsRef.current.enableSepaB2C = pendingEnableSepaB2C;
                }

                if (pendingUser !== undefined) {
                    paymentMethodsRef.current.user = pendingUser;
                }

                if (pendingPlanIDs !== undefined) {
                    paymentMethodsRef.current.planIDs = pendingPlanIDs;
                }

                if (pendingSubscription !== undefined) {
                    paymentMethodsRef.current.subscription = pendingSubscription;
                }

                if (pendingPaymentExtended !== undefined) {
                    paymentMethodsRef.current.paymentStatus = pendingPaymentExtended;
                }

                if (pendingCanUseApplePay !== undefined) {
                    paymentMethodsRef.current.canUseApplePay = pendingCanUseApplePay;
                }

                if (pendingIsTrial !== undefined) {
                    paymentMethodsRef.current.isTrial = pendingIsTrial;
                }
            }

            setStatus(paymentMethodsRef.current.paymentStatus);
            setSavedMethods(paymentMethodsRef.current.paymentMethods);

            const methods = updateMethods();
            const { allMethods } = getComputedMethods(methods);

            setSelectedMethod(allMethods[0]);
            setLoading(false);
        }

        void run();
    }, []);

    useEffect(() => {
        if (!paymentMethodsRef.current) {
            pendingDataRef.current = {
                pendingAmount: amount,
                pendingCurrency: currency,
                pendingCoupon: coupon,
                pendingFlow: flow,
                pendingSelectedPlanName: selectedPlanName,
                pendingBillingAddress: billingAddress,
                pendingEnableSepa: enableSepa,
                pendingEnableSepaB2C: enableSepaB2C,
                pendingUser: user,
                pendingPlanIDs: planIDs,
                pendingSubscription: subscription,
                pendingPaymentStatus: paymentStatus,
                pendingCanUseApplePay: canUseApplePay,
                pendingIsTrial: isTrial,
            };
            return;
        }

        paymentMethodsRef.current.amount = amount;
        paymentMethodsRef.current.currency = currency;
        paymentMethodsRef.current.coupon = coupon ?? '';
        paymentMethodsRef.current.flow = flow;
        paymentMethodsRef.current.selectedPlanName = selectedPlanName;
        paymentMethodsRef.current.billingAddress = billingAddress;
        paymentMethodsRef.current.enableSepa = !!enableSepa;
        paymentMethodsRef.current.enableSepaB2C = !!enableSepaB2C;
        paymentMethodsRef.current.user = user;
        paymentMethodsRef.current.planIDs = planIDs;
        paymentMethodsRef.current.subscription = subscription;
        paymentMethodsRef.current.canUseApplePay = !!canUseApplePay;
        paymentMethodsRef.current.isTrial = !!isTrial;
        if (paymentStatus) {
            paymentMethodsRef.current.paymentStatus = paymentStatus;
            setStatus(paymentStatus);
        }
        updateMethods();
    }, [amount, currency, coupon, flow, selectedPlanName, billingAddress, canUseApplePay, isTrial]);

    const { usedMethods, newMethods, allMethods, lastUsedMethod } = getComputedMethods();

    const getSavedMethodByID = (paymentMethodID: string | undefined): SavedPaymentMethod | undefined => {
        if (!paymentMethodsRef.current || !paymentMethodID) {
            return;
        }

        return paymentMethodsRef.current.getSavedMethodById(paymentMethodID);
    };

    const getSavedInternalMethodByID = (
        paymentMethodID: string | undefined
    ): SavedPaymentMethodInternal | undefined => {
        const method = getSavedMethodByID(paymentMethodID);
        if (isSavedPaymentMethodInternal(method)) {
            return method;
        }

        return;
    };

    const getSavedExternalMethodByID = (
        paymentMethodID: string | undefined
    ): SavedPaymentMethodExternal | undefined => {
        const method = getSavedMethodByID(paymentMethodID);
        if (isSavedPaymentMethodExternal(method)) {
            return method;
        }

        return;
    };

    const selectMethod = (id?: PaymentMethodType) => {
        if (!id) {
            setSelectedMethod(undefined);
            return;
        }

        const method = allMethods.find((method) => {
            return method.value === id;
        });

        if (method) {
            if (selectedMethod?.value !== method.value) {
                onMethodChanged?.(method);
            }
            setSelectedMethod(method);
            return method;
        }
    };

    const isMethodTypeEnabled = (methodType: PlainPaymentMethodType) => {
        if (!paymentMethodsRef.current) {
            return false;
        }

        return paymentMethodsRef.current.isMethodTypeEnabled(methodType);
    };

    const savedInternalSelectedMethod = getSavedInternalMethodByID(selectedMethod?.value);
    const savedExternalSelectedMethod = getSavedExternalMethodByID(selectedMethod?.value);
    const savedSelectedMethod = getSavedMethodByID(selectedMethod?.value);

    const isNewPaypal =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.PAYPAL && !isExistingPaymentMethod(selectedMethod?.value);

    const isNewApplePay =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.APPLE_PAY && !isExistingPaymentMethod(selectedMethod?.value);

    return {
        selectedMethod,
        savedInternalSelectedMethod,
        savedExternalSelectedMethod,
        savedSelectedMethod,
        selectMethod,
        loading,
        usedMethods,
        newMethods,
        allMethods,
        lastUsedMethod,
        getSavedMethodByID,
        status,
        savedMethods,
        isNewPaypal,
        isNewApplePay,
        isMethodTypeEnabled,
    };
};
