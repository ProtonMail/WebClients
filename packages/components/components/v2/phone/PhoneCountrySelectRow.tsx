import type { Ref } from 'react';
import { forwardRef } from 'react';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

import type { CountryOptionData } from './helper';

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
                <img className="shrink-0" alt="" src={data.countryFlag} width="30" height="20" />
                <span className="flex-1 pl-2 text-ellipsis">{data.countryName}</span>
                <span className="shrink-0 text-bold">+{data.countryCallingCode}</span>
            </DropdownMenuButton>
        </div>
    );
};

export default forwardRef<HTMLDivElement, Props>(CountrySelectRow);
