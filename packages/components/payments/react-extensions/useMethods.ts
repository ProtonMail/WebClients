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
    type BillingPlatform,
    type Currency,
    PAYMENT_METHOD_TYPES,
    type PLANS,
    type Subscription,
    canUseChargebee,
    initializePaymentMethods,
    isExistingPaymentMethod,
    isSavedPaymentMethodExternal,
    isSavedPaymentMethodInternal,
} from '@proton/payments';
import type { Api, ChargebeeEnabled, ChargebeeUserExists, User } from '@proton/shared/lib/interfaces';

export type OnMethodChangedHandler = (method: AvailablePaymentMethod) => void;

export interface Props {
    amount: number;
    currency: Currency;
    coupon?: string | null;
    flow: PaymentMethodFlow;
    paymentStatus?: PaymentStatus;
    paymentMethods?: SavedPaymentMethod[];
    onMethodChanged?: OnMethodChangedHandler;
    isChargebeeEnabled: () => ChargebeeEnabled;
    paymentsApi: PaymentsApi;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingAddress?: BillingAddress;
    billingPlatform?: BillingPlatform;
    chargebeeUserExists?: ChargebeeUserExists;
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
        isChargebeeEnabled,
        paymentsApi,
        selectedPlanName,
        billingAddress,
        billingPlatform,
        chargebeeUserExists,
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
        pendingChargebee?: ChargebeeEnabled;
        pendingSelectedPlanName?: PLANS | ADDON_NAMES;
        pendingBillingAddress?: BillingAddress;
        pendingBillingPlatform?: BillingPlatform;
        pendingChargebeeUserExists?: ChargebeeUserExists;
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
                chargebeeEnabled: isChargebeeEnabled(),
                paymentsApi,
                selectedPlanName,
                billingPlatform,
                chargebeeUserExists: overrideChargebeeUserExists ?? chargebeeUserExists,
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
                    pendingChargebee,
                    pendingSelectedPlanName,
                    pendingBillingAddress,
                    pendingBillingPlatform,
                    pendingChargebeeUserExists,
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

                if (pendingChargebee !== undefined) {
                    paymentMethodsRef.current.chargebeeEnabled = pendingChargebee;
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

                if (pendingBillingPlatform !== undefined) {
                    paymentMethodsRef.current.billingPlatform = pendingBillingPlatform;
                }

                if (pendingChargebeeUserExists !== undefined) {
                    paymentMethodsRef.current.chargebeeUserExists =
                        overrideChargebeeUserExists ?? pendingChargebeeUserExists;
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
                pendingChargebee: isChargebeeEnabled(),
                pendingSelectedPlanName: selectedPlanName,
                pendingBillingAddress: billingAddress,
                pendingEnableSepa: enableSepa,
                pendingEnableSepaB2C: enableSepaB2C,
                pendingBillingPlatform: billingPlatform,
                pendingChargebeeUserExists: chargebeeUserExists,
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
        paymentMethodsRef.current.chargebeeEnabled = isChargebeeEnabled();
        paymentMethodsRef.current.selectedPlanName = selectedPlanName;
        paymentMethodsRef.current.billingAddress = billingAddress;
        paymentMethodsRef.current.enableSepa = !!enableSepa;
        paymentMethodsRef.current.enableSepaB2C = !!enableSepaB2C;
        paymentMethodsRef.current.billingPlatform = billingPlatform;
        paymentMethodsRef.current.chargebeeUserExists = overrideChargebeeUserExists ?? chargebeeUserExists;
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
    }, [
        amount,
        currency,
        coupon,
        flow,
        isChargebeeEnabled(),
        selectedPlanName,
        billingAddress,
        billingPlatform,
        overrideChargebeeUserExists,
        chargebeeUserExists,
        canUseApplePay,
        isTrial,
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
