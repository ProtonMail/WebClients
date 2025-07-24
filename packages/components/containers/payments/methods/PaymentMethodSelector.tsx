import { c } from 'ttag';

import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from '@proton/payments';
import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey-colored.svg';
import discoverProtectBuySvg from '@proton/styles/assets/img/bank-icons/discover-protectbuy-colored.svg';
import jcbLogoSvg from '@proton/styles/assets/img/bank-icons/jcb-logo.png';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode-colored.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure-colored.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    options: ViewPaymentMethod[];
    method?: PaymentMethodType;
    onChange: (value: PaymentMethodType) => void;
    lastUsedMethod?: ViewPaymentMethod;
    forceDropdown?: boolean;
    narrow?: boolean;
    showCardIcons?: boolean;
}

const PaymentMethodSelector = ({
    method,
    lastUsedMethod,
    options,
    onChange,
    forceDropdown,
    narrow,
    showCardIcons = false,
}: Props) => {
    if (options.length <= 1) {
        // Not helpful to show this if there's only a single option
        return null;
    }

    const hasSavedPaymentMethod = options.find((it) => it.isSaved);
    const hasApplePay = options.some(({ type }) => type === PAYMENT_METHOD_TYPES.APPLE_PAY);
    const hasSEPA = options.some(({ type }) => type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);
    const showRadioButtons =
        (options.length <= 2 && !forceDropdown) ||
        // if user already has a saved payment method, we don't need to show all the payment methods at once
        ((hasApplePay || hasSEPA) && !hasSavedPaymentMethod);

    if (showRadioButtons) {
        return (
            <>
                {options.map(({ text, value, icon }) => {
                    return (
                        <label
                            htmlFor={value}
                            key={value}
                            className={clsx([
                                'py-2 flex items-center gap-2',
                                lastUsedMethod?.value === value && 'border-bottom',
                            ])}
                        >
                            <span className="flex items-center">
                                <Radio
                                    className="mr-2"
                                    id={value}
                                    name="value"
                                    checked={value === method}
                                    onChange={() => onChange(value)}
                                    data-testid={`payment-method-${value}`}
                                />
                                {icon && <Icon className="mr-2" name={icon} />}
                                <span className="text-cut">{text}</span>
                            </span>

                            {
                                // Only show suffix icons for card payments
                                showCardIcons && value === 'chargebee-card' && (
                                    <div className="flex items-center justify-center gap-2 flex-nowrap ml-6">
                                        <img
                                            alt={c('Info').t`Visa Secure logo`}
                                            style={{ maxHeight: '26px' }}
                                            src={verifiedByVisaSvg}
                                        />
                                        <img
                                            alt={c('Info').t`Mastercard SecureCode logo`}
                                            style={{ maxHeight: '26px' }}
                                            src={mastercardSecurecodeSvg}
                                        />
                                        <img
                                            alt={c('Info').t`Discover ProtectBuy logo`}
                                            style={{ maxHeight: '26px' }}
                                            src={discoverProtectBuySvg}
                                        />
                                        <img
                                            alt={c('Info').t`American Express SafeKey logo`}
                                            style={{ maxHeight: '26px' }}
                                            src={americanExpressSafekeySvg}
                                        />
                                        <img
                                            alt={c('Info').t`JCB logo`}
                                            style={{ maxHeight: '26px' }}
                                            src={jcbLogoSvg}
                                        />
                                    </div>
                                )
                            }
                        </label>
                    );
                })}
            </>
        );
    }

    const size: DropdownSize | undefined = narrow
        ? {
              width: DropdownSizeUnit.Dynamic,
          }
        : undefined;

    return (
        <SelectTwo
            id="select-method"
            value={method}
            onChange={({ value }) => onChange(value)}
            className={clsx(narrow && 'w-auto')}
            size={size}
            data-testid="payment-method-selector"
        >
            {options.flatMap((option) => {
                const child = (
                    <Option
                        key={option.value}
                        value={option.value}
                        title={option.text}
                        data-testid={`payment-method-${option.value}`}
                    >
                        <span className="inline-flex max-w-full flex-nowrap justify-start">
                            {option.icon && <Icon className="mr-2 my-auto shrink-0" name={option.icon} />}
                            <span className="text-ellipsis">{option.text}</span>
                        </span>
                    </Option>
                );
                if (lastUsedMethod?.value === option.value) {
                    return [
                        child,
                        <div className="py-2 block" key={`${option.value}-separator`}>
                            <hr className="my-0" />
                        </div>,
                    ];
                }
                return child;
            })}
        </SelectTwo>
    );
};

export default PaymentMethodSelector;
