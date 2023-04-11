import { PAYMENT_METHOD_TYPE } from '@proton/shared/lib/constants';

import { Icon, Option, Radio, SelectTwo } from '../../components';
import { classnames } from '../../helpers';
import { PaymentMethodData } from './interface';

interface Props {
    options: PaymentMethodData[];
    method?: PAYMENT_METHOD_TYPE;
    onChange: (value: PAYMENT_METHOD_TYPE) => void;
    lastUsedMethod?: PaymentMethodData;
}

const PaymentMethodSelector = ({ method, lastUsedMethod, options, onChange }: Props) => {
    if (options.length <= 2) {
        return (
            <>
                {options.map(({ text, value, disabled, icon }) => {
                    return (
                        <label
                            htmlFor={value}
                            key={value}
                            className={classnames([
                                'pt0-5 pb0-5 flex flex-nowrap flex-align-items-center',
                                lastUsedMethod?.value === value && 'border-bottom',
                            ])}
                        >
                            <Radio
                                disabled={disabled}
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
    return (
        <SelectTwo id="select-method" value={method} onChange={({ value }) => onChange(value)}>
            {options.flatMap((option) => {
                const child = (
                    <Option key={option.value} value={option.value} title={option.text}>
                        <span className="inline-flex max-w100 flex-nowrap flex-items-align-center flex-justify-start">
                            {option.icon && <Icon className="mr-2 my-auto flex-item-noshrink" name={option.icon} />}
                            <span className="text-ellipsis">{option.text}</span>
                        </span>
                    </Option>
                );
                if (lastUsedMethod?.value === option.value) {
                    return [
                        child,
                        <div className="py0-5 block" key={`${option.value}-separator`}>
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
