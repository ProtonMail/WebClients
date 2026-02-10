import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Radio from '@proton/components/components/input/Radio';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import type { ClientMethodsHook, ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { IcChevronRightFilled } from '@proton/icons/icons/IcChevronRightFilled';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type {
    PaymentMethodType,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '@proton/payments/core/interface';

import PaymentMethodIcon from './PaymentMethodIcon';
import SavedPaymentMethodDetails from './SavedPaymentMethodDetails';
import SavedPaymentMethodIcon from './SavedPaymentMethodIcon';

interface AvailablePaymentMethodProps {
    methods: ViewPaymentMethod[];
    selectedMethod: PaymentMethodType | undefined;
    onChange: (value: PaymentMethodType) => void;
    savedMethod: SavedPaymentMethodInternal | SavedPaymentMethodExternal | undefined;
}

const AvailablePaymentMethods = ({ methods, onChange, selectedMethod, savedMethod }: AvailablePaymentMethodProps) => {
    return methods.map((method) => {
        return (
            <InputFieldStacked isGroupElement key={method.value}>
                <Radio
                    checked={selectedMethod === method.value}
                    onChange={() => onChange(method.value)}
                    id={method.value}
                    name="payment-method"
                    value={method.value}
                    className="flex"
                >
                    <span className="flex flex-1 justify-space-between items-center gap-2">
                        {method.text}
                        {method.isSaved ? (
                            <SavedPaymentMethodIcon savedMethod={savedMethod} />
                        ) : (
                            <PaymentMethodIcon type={method.type} />
                        )}
                    </span>
                </Radio>
            </InputFieldStacked>
        );
    });
};

interface Props {
    methods: ClientMethodsHook;
    selectedMethodValue: ViewPaymentMethod['value'] | undefined;
    onPaymentMethodChange: (currency: PaymentMethodType) => void;
}

const PaymentMethodSelector = ({ methods, selectedMethodValue, onPaymentMethodChange }: Props) => {
    const [showAllMethods, setShowAllMethods] = useState(false);
    const { allMethods, savedInternalSelectedMethod, savedExternalSelectedMethod } = methods;
    // Filter Cash and SEPA as they are not required for Lite app
    const availableMethods = allMethods.filter(
        (method) =>
            method.type !== PAYMENT_METHOD_TYPES.CASH &&
            method.type !== PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
    );

    // Show top 2 PM by default and show all methods if user expands the view
    const visibleMethods = showAllMethods ? availableMethods : availableMethods.slice(0, 2);
    const savedMethod = savedInternalSelectedMethod ?? savedExternalSelectedMethod;

    const showSavedPaymentMethods = savedMethod && !showAllMethods;

    return (
        <InputFieldStackedGroup classname="my-4">
            {showSavedPaymentMethods ? (
                <InputFieldStacked isGroupElement>
                    <SavedPaymentMethodDetails type={savedMethod.Type} details={savedMethod.Details} />
                </InputFieldStacked>
            ) : (
                <AvailablePaymentMethods
                    methods={visibleMethods}
                    selectedMethod={selectedMethodValue}
                    onChange={(value) => onPaymentMethodChange(value)}
                    savedMethod={savedMethod}
                />
            )}
            {!showAllMethods && (
                <InputFieldStacked isGroupElement>
                    <Button
                        size="small"
                        onClick={() => setShowAllMethods(true)}
                        shape="ghost"
                        style={{
                            '--padding-inline': 0,
                        }}
                    >
                        <span className="flex items-center gap-2">
                            {savedMethod ? <IcPlus size={5} /> : <IcChevronRightFilled size={5} />}
                            {savedMethod
                                ? c('Label').t`Use another payment method`
                                : c('Label').t`More payment methods`}
                        </span>
                    </Button>
                </InputFieldStacked>
            )}
        </InputFieldStackedGroup>
    );
};

export default PaymentMethodSelector;
