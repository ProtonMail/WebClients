import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import Radio from '@proton/components/components/input/Radio';
import type { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import type { PaymentMethodType } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import { Option, SelectTwo } from '../../../components';

interface Props {
    options: ViewPaymentMethod[];
    method?: PaymentMethodType;
    onChange: (value: PaymentMethodType) => void;
    lastUsedMethod?: ViewPaymentMethod;
    forceDropdown?: boolean;
    narrow?: boolean;
}

const PaymentMethodSelector = ({ method, lastUsedMethod, options, onChange, forceDropdown, narrow }: Props) => {
    if (options.length <= 2 && !forceDropdown) {
        return (
            <>
                {options.map(({ text, value, icon }) => {
                    return (
                        <label
                            htmlFor={value}
                            key={value}
                            className={clsx([
                                'py-2 flex flex-nowrap items-center',
                                lastUsedMethod?.value === value && 'border-bottom',
                            ])}
                        >
                            <Radio
                                className="mr-2"
                                id={value}
                                name="value"
                                checked={value === method}
                                onChange={() => onChange(value)}
                            />
                            {icon && <Icon className="mr-2" name={icon} />}
                            <span className="text-cut">{text}</span>
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
                    <Option key={option.value} value={option.value} title={option.text}>
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
