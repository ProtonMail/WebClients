import type { HTMLAttributes } from 'react';

import { c } from 'ttag';

import Copy from '@proton/components/components/button/Copy';
import clsx from '@proton/utils/clsx';

import { useNotifications } from '../../..';

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
    const { createNotification } = useNotifications();
    return (
        <>
            <div className="text-rg text-semibold mb-1">{label}</div>
            <div className={clsx('rounded bg-weak py-1 px-3 flex justify-space-between items-center', className)}>
                <span className="text-break" {...rest}>
                    {value}
                </span>
                <Copy
                    value={`${value}`}
                    shape="ghost"
                    size="small"
                    onCopy={() => {
                        createNotification({
                            text: c('Success').t`Copied to clipboard`,
                        });
                    }}
                />
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
