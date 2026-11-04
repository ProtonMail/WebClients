import type { ReactNode } from 'react';

import type { BitcoinHook } from '../../react-extensions/useBitcoin';
import { BitcoinInfoMessage } from './BitcoinInfoMessage';
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
