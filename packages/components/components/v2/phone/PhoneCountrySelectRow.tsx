import { Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import { DropdownMenuButton } from '../../dropdown';
import { CountryOptionData } from './helper';

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
                className={clsx(['block w-full text-ellipsis text-left outline-none flex', data === value && 'active'])}
                title={data.countryName}
                onClick={() => {
                    onChange(data);
                }}
            >
                <img className="flex-item-noshrink" alt="" src={data.countryFlag} width="30" height="20" />
                <span className="flex-item-fluid pl-2 text-ellipsis">{data.countryName}</span>
                <span className="flex-item-noshrink text-bold">+{data.countryCallingCode}</span>
            </DropdownMenuButton>
        </div>
    );
};

export default forwardRef<HTMLDivElement, Props>(CountrySelectRow);
