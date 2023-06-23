import { HTMLAttributes } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { Copy } from '../../components';

export interface Props {
    amount: number;
    address: string;
}

const BitcoinDetailsLine = ({
    label,
    value,
    fieldClassName: className,
    ...rest
}: {
    label: string;
    value: string;
    fieldClassName?: string;
} & HTMLAttributes<HTMLElement>) => {
    return (
        <>
            <div className="text-rg text-semibold mb-1">{label}</div>
            <div
                className={clsx(
                    'rounded bg-weak py-1 px-3 flex flex-justify-space-between flex-align-items-center',
                    className
                )}
            >
                <span {...rest}>{value}</span>
                <Copy value={`${value}`} shape="ghost" size="small" />
            </div>
        </>
    );
};

const BitcoinDetails = ({ amount, address }: Props) => {
    return (
        <div>
            {amount ? (
                <BitcoinDetailsLine label={c('Label').t`BTC amount`} value={`${amount}`} fieldClassName="mb-4" />
            ) : null}
            <BitcoinDetailsLine label={c('Label').t`BTC address`} value={address} data-testid="btc-address" />
        </div>
    );
};

export default BitcoinDetails;
