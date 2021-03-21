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
                className={classnames(['block w100 text-ellipsis text-left no-outline', data === value && 'active'])}
                title={data.countryName}
                onClick={() => {
                    onChange(data);
                }}
            >
                <div className="flex">
                    <img
                        role="presentation"
                        className="flex-item-noshrink"
                        alt={data.countryName}
                        src={data.countryFlag}
                        width="30"
                        height="20"
                    />
                    <span className="flex-item-fluid pl0-5 text-ellipsis">{data.countryName}</span>
                    <span className="flex-item-noshrink text-bold">+{data.countryCallingCode}</span>
                </div>
            </DropdownMenuButton>
        </div>
    );
};

export default forwardRef<HTMLDivElement, Props>(CountrySelectRow);
