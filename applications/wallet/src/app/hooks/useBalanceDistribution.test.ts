import { walletsWithAccountsWithBalanceAndTxs } from '../tests';
import { WalletType } from '../types/api';
import { useBalanceDistribution } from './useBalanceDistribution';

describe('useBalanceDistribution', () => {
    it('should return correct lightning balance', () => {
        const balances = useBalanceDistribution(walletsWithAccountsWithBalanceAndTxs);

        expect(balances[WalletType.Lightning]).toBe(8875342);
    });

    it('should return correct onchain balance', () => {
        const balances = useBalanceDistribution(walletsWithAccountsWithBalanceAndTxs);

        expect(balances[WalletType.OnChain]).toBe(22881239);
    });
});
