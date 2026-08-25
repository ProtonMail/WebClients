import type { HTMLAttributes } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import clsx from '@proton/utils/clsx';

import Copy from '../../../components/button/Copy';
import SkeletonLoader from '../../../components/skeletonLoader/SkeletonLoader';

export interface Props {
    amount: number;
    address: string;
    loading: boolean;
}

const BitcoinDetailsLine = ({
    label,
    value,
    loading,
    fieldClassName: className,
    ...rest
}: {
    label: string;
    value: string;
    loading?: boolean;
    fieldClassName?: string;
} & HTMLAttributes<HTMLElement>) => {
    const { createNotification } = useNotifications();
    return (
        <>
            <div className="text-rg text-semibold mb-1">{label}</div>
            {loading ? (
                <SkeletonLoader data-testid="bitcoin-details-skeleton" width="100%" height="2em" index={1} />
            ) : (
                <div className={clsx('rounded bg-weak py-1 px-3 flex justify-space-between items-center', className)}>
                    <>
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
                    </>
                </div>
            )}
        </>
    );
};

const BitcoinDetails = ({ amount, address, loading }: Props) => {
    return (
        <div>
            {amount ? (
                <BitcoinDetailsLine label={c('Label').t`BTC amount`} value={`${amount}`} fieldClassName="mb-4" />
            ) : null}
            <BitcoinDetailsLine
                loading={loading}
                label={c('Label').t`BTC address`}
                value={address}
                data-testid="btc-address"
            />
        </div>
    );
};

export default BitcoinDetails;
