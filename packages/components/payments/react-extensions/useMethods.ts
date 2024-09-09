import { useEffect, useRef, useState } from 'react';

import { useGetPaymentStatus } from '@proton/components/hooks';
import type { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import type { Api, BillingPlatform, ChargebeeEnabled, ChargebeeUserExists } from '@proton/shared/lib/interfaces';

import type {
    AvailablePaymentMethod,
    PaymentMethodFlows,
    PaymentMethodStatusExtended,
    PaymentMethodType,
    PaymentMethods,
    PaymentsApi,
    PlainPaymentMethodType,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '../core';
import {
    PAYMENT_METHOD_TYPES,
    canUseChargebee,
    initializePaymentMethods,
    isExistingPaymentMethod,
    isSavedPaymentMethodExternal,
    isSavedPaymentMethodInternal,
} from '../core';

export type OnMethodChangedHandler = (method: AvailablePaymentMethod) => void;

export interface Props {
    amount: number;
    coupon?: string | null;
    flow: PaymentMethodFlows;
    paymentMethodStatusExtended?: PaymentMethodStatusExtended;
    paymentMethods?: SavedPaymentMethod[];
    onMethodChanged?: OnMethodChangedHandler;
    isChargebeeEnabled: () => ChargebeeEnabled;
    paymentsApi: PaymentsApi;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingPlatform?: BillingPlatform;
    chargebeeUserExists?: ChargebeeUserExists;
    disableNewPaymentMethods?: boolean;
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
    status: PaymentMethodStatusExtended | undefined;
    savedMethods: SavedPaymentMethod[] | undefined;
    isNewPaypal: boolean;
    isMethodTypeEnabled: (methodType: PlainPaymentMethodType) => boolean;
};

type UsedAndNewMethods = {
    usedMethods: AvailablePaymentMethod[];
    newMethods: AvailablePaymentMethod[];
};

const useInhouseToChargebeeSwitch = ({
    selectedMethod,
    availableMethods,
    isMethodTypeEnabled,
    selectMethod,
    isChargebeeEnabled,
}: {
    selectedMethod: AvailablePaymentMethod | undefined;
    availableMethods: UsedAndNewMethods;
    isMethodTypeEnabled: (methodType: PlainPaymentMethodType) => boolean;
    selectMethod: (id?: string) => AvailablePaymentMethod | undefined;
    isChargebeeEnabled: () => ChargebeeEnabled;
}) => {
    // We don't apply the switching logic for saved methods, because on-session upgrades
    // supposed to support selecting in-house saved methods. The method will be imported to Chargebee
    // on payment and then the method updated to CB one.
    const isMigratableSavedMethod = !!selectedMethod?.isSaved && canUseChargebee(isChargebeeEnabled());

    // An effect of switches between Chargebee and inhouse in case if inhouse or Chargebee is not available.
    useEffect(() => {
        // Kill switch for chargebee card. If the kill switch was activated, we need to make sure that the selected
        // method is not chargebee card. If it is, we need to select the default card method.
        {
            const chargebeeCardSelected = selectedMethod?.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
            const chargebeeCardNotAvailable = !isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);

            const switchToInhouse = chargebeeCardSelected && chargebeeCardNotAvailable;
            if (switchToInhouse) {
                selectMethod(PAYMENT_METHOD_TYPES.CARD);
            }
        }

        // Reverse switch for the card method. This doesn't cover the scope of a kill-switch per-se, but still acts
        // in a similar manner. The use case is, for example, Pass Signup page where user can switch between B2C and
        // B2B on the same page. If user selects B2B, then the in-house card method should will be selected. When user
        // switches back to B2C, the chargebee card method should be selected.
        {
            const cardSelected = selectedMethod?.type === PAYMENT_METHOD_TYPES.CARD;
            const cardNotAvailable = !isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CARD);
            // Additional check to make sure that the chargebee card method is available.
            const chargebeeCardAvailable = isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);

            const switchToChargebee =
                cardSelected && cardNotAvailable && chargebeeCardAvailable && !isMigratableSavedMethod;
            if (switchToChargebee) {
                selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
            }
        }

        // Kill switch for chargebee paypal. The same same as above.
        {
            const chargebeePaypalSelected = selectedMethod?.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
            const chargebeePaypalNotAvailable = !isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);

            const switchToInhouse = chargebeePaypalSelected && chargebeePaypalNotAvailable;
            if (switchToInhouse) {
                selectMethod(PAYMENT_METHOD_TYPES.PAYPAL);
            }
        }

        // reverse switch for the paypal method. The same as above.
        {
            const paypalSelected = selectedMethod?.type === PAYMENT_METHOD_TYPES.PAYPAL;
            const paypalNotAvailable = !isMethodTypeEnabled(PAYMENT_METHOD_TYPES.PAYPAL);
            // Additional check to make sure that the chargebee paypal method is available.
            const chargebeePaypalAvailable = isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);

            const switchToChargebee =
                paypalSelected && paypalNotAvailable && chargebeePaypalAvailable && !isMigratableSavedMethod;
            if (switchToChargebee) {
                selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
            }
        }
    }, [selectedMethod, availableMethods]);
};

export const useMethods = (
    {
        paymentMethodStatusExtended,
        paymentMethods,
        amount,
        coupon,
        flow,
        onMethodChanged,
        isChargebeeEnabled,
        paymentsApi,
        selectedPlanName,
        billingPlatform,
        chargebeeUserExists,
        disableNewPaymentMethods,
    }: Props,
    { api, isAuthenticated }: Dependencies
): MethodsHook => {
    const paymentMethodsRef = useRef<PaymentMethods>();
    const pendingDataRef = useRef<{
        pendingAmount?: number;
        pendingCoupon?: string | null;
        pendingFlow?: PaymentMethodFlows;
        pendingChargebee?: ChargebeeEnabled;
        pendingSelectedPlanName?: PLANS | ADDON_NAMES;
        pendingBillingPlatform?: BillingPlatform;
        pendingChargebeeUserExists?: ChargebeeUserExists;
        pendingDisableNewPaymentMethods?: boolean;
    }>();

    const [loading, setLoading] = useState(true);
    const [availableMethods, setAvailableMethods] = useState<UsedAndNewMethods>({
        usedMethods: [],
        newMethods: [],
    });
    const [selectedMethod, setSelectedMethod] = useState<AvailablePaymentMethod | undefined>();

    const [status, setStatus] = useState<PaymentMethodStatusExtended | undefined>(paymentMethodStatusExtended);
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[] | undefined>();

    const [overrideChargebeeUserExists, setOverrideChargebeeUserExists] = useState<ChargebeeUserExists | undefined>();

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
            const paymentStatus = paymentMethodStatusExtended ?? (await getPaymentStatus({ api }));

            paymentMethodsRef.current = await initializePaymentMethods(
                api,
                paymentStatus,
                paymentMethods,
                isAuthenticated,
                amount,
                coupon ?? '',
                flow,
                isChargebeeEnabled(),
                paymentsApi,
                selectedPlanName,
                billingPlatform,
                overrideChargebeeUserExists ?? chargebeeUserExists,
                !!disableNewPaymentMethods
            );

            // Initialization might take some time, so we need to check if there is any pending data
            // If for example the amount changes before initialization is done, then it won't be updated by the usual
            // useEffect handler below. In this case we need to update the amount manually.
            // Same goes for coupon and flow.
            if (pendingDataRef.current) {
                // Getting the saved values and clearing the pending right away, because this is a one-time thing
                const {
                    pendingAmount,
                    pendingCoupon,
                    pendingFlow,
                    pendingChargebee,
                    pendingSelectedPlanName,
                    pendingBillingPlatform,
                    pendingChargebeeUserExists,
                    pendingDisableNewPaymentMethods,
                } = pendingDataRef.current;
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

                if (pendingChargebee !== undefined) {
                    paymentMethodsRef.current.chargebeeEnabled = pendingChargebee;
                }

                if (pendingSelectedPlanName) {
                    paymentMethodsRef.current.selectedPlanName = pendingSelectedPlanName;
                }

                if (pendingBillingPlatform !== undefined) {
                    paymentMethodsRef.current.billingPlatform = pendingBillingPlatform;
                }

                if (pendingChargebeeUserExists !== undefined) {
                    paymentMethodsRef.current.chargebeeUserExists =
                        overrideChargebeeUserExists ?? pendingChargebeeUserExists;
                }

                if (pendingDisableNewPaymentMethods !== undefined) {
                    paymentMethodsRef.current.disableNewPaymentMethods = pendingDisableNewPaymentMethods;
                }
            }

            setStatus(paymentMethodsRef.current.statusExtended);
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
                pendingChargebee: isChargebeeEnabled(),
                pendingSelectedPlanName: selectedPlanName,
                pendingBillingPlatform: billingPlatform,
                pendingChargebeeUserExists: chargebeeUserExists,
                pendingDisableNewPaymentMethods: disableNewPaymentMethods,
            };
            return;
        }

        paymentMethodsRef.current.amount = amount;
        paymentMethodsRef.current.coupon = coupon ?? '';
        paymentMethodsRef.current.flow = flow;
        paymentMethodsRef.current.chargebeeEnabled = isChargebeeEnabled();
        paymentMethodsRef.current.selectedPlanName = selectedPlanName;
        paymentMethodsRef.current.billingPlatform = billingPlatform;
        paymentMethodsRef.current.chargebeeUserExists = overrideChargebeeUserExists ?? chargebeeUserExists;
        paymentMethodsRef.current.disableNewPaymentMethods = !!disableNewPaymentMethods;

        updateMethods();
    }, [
        amount,
        coupon,
        flow,
        isChargebeeEnabled(),
        selectedPlanName,
        billingPlatform,
        overrideChargebeeUserExists,
        chargebeeUserExists,
        disableNewPaymentMethods,
    ]);

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
            // that's a workaround for the case when user selects bitcoin in pass signup and clicks "continue"
            // by default the page will select BITCOIN payment method, so we will select CHARGEBEE_BITCOIN instead
            if (id === PAYMENT_METHOD_TYPES.BITCOIN || id === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
                return (
                    method.type === PAYMENT_METHOD_TYPES.BITCOIN ||
                    method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN
                );
            }

            return method.value === id;
        });

        if (
            method?.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
            !overrideChargebeeUserExists &&
            paymentMethodsRef.current
        ) {
            paymentMethodsRef.current.chargebeeUserExists = 1;
            setOverrideChargebeeUserExists(1);
        }

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

    useInhouseToChargebeeSwitch({
        selectedMethod,
        availableMethods,
        isMethodTypeEnabled,
        selectMethod,
        isChargebeeEnabled,
    });

    const savedInternalSelectedMethod = getSavedInternalMethodByID(selectedMethod?.value);
    const savedExternalSelectedMethod = getSavedExternalMethodByID(selectedMethod?.value);
    const savedSelectedMethod = getSavedMethodByID(selectedMethod?.value);

    const isNewPaypal =
        selectedMethod?.type === PAYMENT_METHOD_TYPES.PAYPAL && !isExistingPaymentMethod(selectedMethod?.value);

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
        isMethodTypeEnabled,
    };
};
