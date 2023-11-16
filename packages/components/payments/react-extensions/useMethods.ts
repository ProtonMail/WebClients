import { useEffect, useRef, useState } from 'react';

import { Api } from '@proton/shared/lib/interfaces';

import {
    AvailablePaymentMethod,
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodStatus,
    PaymentMethodType,
    PaymentMethods,
    SavedPaymentMethod,
    initializePaymentMethods,
    isExistingPaymentMethod,
} from '../core';

export type OnMethodChangedHandler = (method: AvailablePaymentMethod) => void;

export interface Props {
    amount: number;
    coupon?: string | null;
    flow: PaymentMethodFlows;
    paymentMethodStatus?: PaymentMethodStatus;
    onMethodChanged?: OnMethodChangedHandler;
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

    status: PaymentMethodStatus | undefined;
    savedMethods: SavedPaymentMethod[] | undefined;
    isNewPaypal: boolean;
};

type UsedAndNewMethods = {
    usedMethods: AvailablePaymentMethod[];
    newMethods: AvailablePaymentMethod[];
};

export const useMethods = (
    { paymentMethodStatus, amount, coupon, flow, onMethodChanged }: Props,
    { api, isAuthenticated }: Dependencies
): MethodsHook => {
    const paymentMethodsRef = useRef<PaymentMethods>();
    const pendingDataRef = useRef<{
        pendingAmount?: number;
        pendingCoupon?: string | null;
        pendingFlow?: PaymentMethodFlows;
    }>();

    const [loading, setLoading] = useState(true);
    const [availableMethods, setAvailableMethods] = useState<UsedAndNewMethods>({
        usedMethods: [],
        newMethods: [],
    });
    const [selectedMethod, setSelectedMethod] = useState<AvailablePaymentMethod | undefined>();

    const [status, setStatus] = useState<PaymentMethodStatus | undefined>();
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[] | undefined>();

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
            paymentMethodsRef.current = await initializePaymentMethods(
                api,
                paymentMethodStatus,
                isAuthenticated,
                amount,
                coupon ?? '',
                flow
            );

            // Initialization might take some time, so we need to check if there is any pending data
            // If for example the amount changes before initialization is done, then it won't be updated by the usual
            // useEffect handler below. In this case we need to update the amount manually.
            // Same goes for coupon and flow.
            if (pendingDataRef.current) {
                // Getting the saved values and clearing the pending right away, because this is a one-time thing
                const { pendingAmount, pendingCoupon, pendingFlow } = pendingDataRef.current;
                pendingDataRef.current = undefined;

                // Updating the coupon
                paymentMethodsRef.current.coupon = pendingCoupon ?? '';

                // Updating the amount
                if (typeof pendingAmount === 'number') {
                    paymentMethodsRef.current.amount = pendingAmount;
                }

                // Updating the flow
                if (pendingFlow) {
                    paymentMethodsRef.current.flow = pendingFlow;
                }
            }

            setStatus(paymentMethodsRef.current.paymentMethodStatus);
            setSavedMethods(paymentMethodsRef.current.paymentMethods);

            const methods = updateMethods();
            const { allMethods } = getComputedMethods(methods);

            setSelectedMethod(allMethods[0]);
            setLoading(false);
        }

        run();
    }, []);

    useEffect(() => {
        if (!paymentMethodsRef.current) {
            pendingDataRef.current = {
                pendingAmount: amount,
                pendingCoupon: coupon,
                pendingFlow: flow,
            };
            return;
        }

        paymentMethodsRef.current.amount = amount;
        paymentMethodsRef.current.coupon = coupon ?? '';
        paymentMethodsRef.current.flow = flow;

        updateMethods();
    }, [amount, coupon, flow]);

    const { usedMethods, newMethods, allMethods, lastUsedMethod } = getComputedMethods();

    const getSavedMethodByID = (paymentMethodID: string | undefined): SavedPaymentMethod | undefined => {
        if (!paymentMethodsRef.current || !paymentMethodID) {
            return;
        }

        return paymentMethodsRef.current.getSavedMethodById(paymentMethodID);
    };

    const selectMethod = (id?: PaymentMethodType) => {
        if (!id) {
            setSelectedMethod(undefined);
            return;
        }

        const method = allMethods.find((method) => method.value === id);
        if (method) {
            if (selectedMethod?.value !== method.value) {
                onMethodChanged?.(method);
            }
            setSelectedMethod(method);
            return method;
        }
    };

    const savedSelectedMethod = getSavedMethodByID(selectedMethod?.value);

    const isNewPaypal =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.PAYPAL && !isExistingPaymentMethod(selectedMethod?.value);

    return {
        selectedMethod,
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
    };
};
