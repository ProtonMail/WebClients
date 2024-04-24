import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { useTxBuilder } from './useTxBuilder';

describe('useTxBuilder', () => {
    it('should stack update then unwrap them', async () => {
        const { result } = renderHook(() => useTxBuilder());

        result.current.updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(2)));
        await waitFor(() => expect(result.current.txBuilder.getFeeRate()).toBe(BigInt(2)));

        result.current.updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(3)));
        result.current.updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(4)));
        result.current.updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(5)));
        result.current.updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(6)));

        expect(result.current.txBuilder.getFeeRate()).toBe(BigInt(2));

        await waitFor(() => expect(result.current.txBuilder.getFeeRate()).toBe(BigInt(6)));
    });
});
