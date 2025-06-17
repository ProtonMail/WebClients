import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms';
import {
    type PaymentMethodType,
    type SavedPaymentMethod,
    isExistingPaymentMethod,
    isSavablePaymentMethod,
    markPaymentMethodAsDefault,
} from '@proton/payments';
import { type Api } from '@proton/shared/lib/interfaces';

export function backendWillChangeDefaultPaymentMethod(selectedPaymentMethod: PaymentMethodType): boolean {
    return !isExistingPaymentMethod(selectedPaymentMethod) && isSavablePaymentMethod(selectedPaymentMethod);
}

export function frontendMustChangeDefaultPaymentMethod(
    methods: SavedPaymentMethod[],
    selectedPaymentMethod: PaymentMethodType
): boolean {
    if (!isExistingPaymentMethod(selectedPaymentMethod)) {
        return false;
    }

    const defaultMethod = methods.find((method) => method.IsDefault);
    if (!defaultMethod) {
        return false;
    }

    const userSelectedNonDefaultSavedMethod = defaultMethod.ID !== selectedPaymentMethod;
    return userSelectedNonDefaultSavedMethod;
}

export function showDefaultPaymentMethodMessage(
    methods: SavedPaymentMethod[],
    selectedPaymentMethodTypeOrValue: PaymentMethodType | undefined
): boolean {
    if (methods.length === 0) {
        return false;
    }

    if (!selectedPaymentMethodTypeOrValue) {
        return false;
    }

    return (
        backendWillChangeDefaultPaymentMethod(selectedPaymentMethodTypeOrValue) ||
        frontendMustChangeDefaultPaymentMethod(methods, selectedPaymentMethodTypeOrValue)
    );
}

export async function changeDefaultPaymentMethodBeforePayment(
    api: Api,
    paymentMethodValue: PaymentMethodType,
    savedMethods: SavedPaymentMethod[]
) {
    try {
        if (frontendMustChangeDefaultPaymentMethod(savedMethods, paymentMethodValue)) {
            await markPaymentMethodAsDefault(api, paymentMethodValue, savedMethods);
        }
    } catch {}
}

interface Props {
    savedPaymentMethods: SavedPaymentMethod[];
    selectedPaymentMethod?: PaymentMethodType;
}

const DefaultPaymentMethodMessage = ({ savedPaymentMethods, selectedPaymentMethod }: Props) => {
    if (!showDefaultPaymentMethodMessage(savedPaymentMethods, selectedPaymentMethod)) {
        return null;
    }

    return (
        <Banner variant={BannerVariants.INFO}>{c('Payments')
            .t`This payment method will become your new default for all future renewals.`}</Banner>
    );
};

export default DefaultPaymentMethodMessage;
