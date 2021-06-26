import React, { forwardRef, Ref } from 'react';
import { CountryOptionData } from './helper';
import { DropdownMenuButton } from '../../dropdown';
import { classnames } from '../../../helpers';

interface Props {
    data: CountryOptionData;
    style: any;
    value?: CountryOptionData;
    onChange: (data: CountryOptionData) => void;
}

const CountrySelectRow = ({ data, style, value, onChange }: Props, ref?: Ref<HTMLDivElement>) => {
    return (
        <div className="dropdown-item" style={style} ref={ref} role="row">
            <DropdownMenuButton
                isSelected={false}
                className={classnames([
                    'block w100 text-ellipsis text-left no-outline flex',
                    data === value && 'active',
                ])}
                title={data.countryName}
                onClick={() => {
                    onChange(data);
                }}
            >
                <img className="flex-item-noshrink" alt="" src={data.countryFlag} width="30" height="20" />
                <span className="flex-item-fluid pl0-5 text-ellipsis">{data.countryName}</span>
                <span className="flex-item-noshrink text-bold">+{data.countryCallingCode}</span>
            </DropdownMenuButton>
        </div>
    );
};

export default forwardRef<HTMLDivElement, Props>(CountrySelectRow);
