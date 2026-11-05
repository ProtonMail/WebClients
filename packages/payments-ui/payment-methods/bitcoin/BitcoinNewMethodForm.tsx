import type { ReactNode } from 'react';

import { BitcoinInfoMessage } from '@proton/payments-hooks/payment-methods/bitcoin/BitcoinInfoMessage';
import type { BitcoinHook } from '@proton/payments-hooks/react-extensions/useBitcoin';

import { BitcoinView } from './BitcoinView';

type Props = {
    bitcoin: Omit<BitcoinHook, 'loading'>;
    loading: boolean;
    taxFields: ReactNode;
};

export const BitcoinNewMethodForm = ({ bitcoin, loading, taxFields }: Props) => (
    <>
        <BitcoinInfoMessage />
        <BitcoinView loading={loading} {...bitcoin} />
        <div className="mt-4">{taxFields}</div>
    </>
);
