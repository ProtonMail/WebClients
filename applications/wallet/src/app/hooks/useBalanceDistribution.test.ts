import { wallets } from '../tests';
import { useBalanceDistribution } from './useBalanceDistribution';

describe('useBalanceDistribution', () => {
    it('should return correct lightning balance', () => {
        const balances = useBalanceDistribution(wallets);

        expect(balances.LIGHTNING).toBe(2712441);
    });

    it('should return correct onchain balance', () => {
        const balances = useBalanceDistribution(wallets);

        expect(balances.ONCHAIN).toBe(20168798);
    });
});
