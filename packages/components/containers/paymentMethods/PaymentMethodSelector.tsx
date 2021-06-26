import React from 'react';
import { PAYMENT_METHOD_TYPE } from '@proton/shared/lib/constants';

import { PaymentMethodData } from './interface';
import { classnames } from '../../helpers';
import { Icon, Radio } from '../../components';

interface Props {
    options: PaymentMethodData[];
    method?: PAYMENT_METHOD_TYPE;
    onChange: (value: PAYMENT_METHOD_TYPE) => void;
    lastCustomMethod?: PaymentMethodData;
}

const PaymentMethodSelector = ({ method, lastCustomMethod, options, onChange }: Props) => {
    return (
        <>
            {options.map(({ text, value, disabled, icon }) => {
                return (
                    <label
                        htmlFor={value}
                        key={value}
                        className={classnames([
                            'pt0-5 pb0-5 flex flex-nowrap flex-align-items-center',
                            lastCustomMethod?.value === value && 'border-bottom',
                        ])}
                    >
                        <Radio
                            disabled={disabled}
                            className="mr0-5"
                            id={value}
                            name="value"
                            checked={value === method}
                            onChange={() => onChange(value)}
                        />
                        <Icon className="mr0-5" name={icon} />
                        <span className="text-cut">{text}</span>
                    </label>
                );
            })}
        </>
    );
};

export default PaymentMethodSelector;
