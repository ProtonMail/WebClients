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

export interface Props {
    amount: number;
    coupon?: string | null;
    flow: PaymentMethodFlows;
    paymentMethodStatus?: PaymentMethodStatus;
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

export const useMethods = (
    { paymentMethodStatus, amount, coupon, flow }: Props,
    { api, isAuthenticated }: Dependencies
): MethodsHook => {
    const paymentMethodsRef = useRef<PaymentMethods>();
    const [loading, setLoading] = useState(true);
    const [availableMethods, setAvailableMethods] = useState<{
        usedMethods: AvailablePaymentMethod[];
        newMethods: AvailablePaymentMethod[];
    }>({
        usedMethods: [],
        newMethods: [],
    });
    const [selectedMethod, setSelectedMethod] = useState<AvailablePaymentMethod | undefined>();

    const [status, setStatus] = useState<PaymentMethodStatus | undefined>();
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[] | undefined>();

    const getComputedMethods = (availableMethodsParam?: {
        usedMethods: AvailablePaymentMethod[];
        newMethods: AvailablePaymentMethod[];
    }) => {
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
        if (!paymentMethodsRef.current) {
            return;
        }

        const { usedMethods, methods: newMethods } = paymentMethodsRef.current.getAvailablePaymentMethods();

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
