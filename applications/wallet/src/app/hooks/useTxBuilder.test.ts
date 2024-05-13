import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { WasmAccount } from '@proton/andromeda';
import { WasmWallet } from '@proton/andromeda';
import { WasmNetwork } from '@proton/andromeda';
import { WasmScriptType } from '@proton/andromeda';
import { WasmDerivationPath } from '@proton/andromeda';

import { useTxBuilder } from './useTxBuilder';

describe('useTxBuilder', () => {
    it('should stack update then unwrap them', async () => {
        const wallet = new WasmWallet(
            WasmNetwork.Testnet,
            'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade'
        );
        const account = new WasmAccount(wallet, WasmScriptType.Taproot, WasmDerivationPath.fromString("m/86'/1'/0'"));

        const { result } = renderHook(() => useTxBuilder({ account, derivationPath: "m/86'/1'/0'", scriptType: 3 }));

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
