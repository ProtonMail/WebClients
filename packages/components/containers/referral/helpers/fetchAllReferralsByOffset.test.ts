import type { Api } from '@proton/shared/lib/interfaces';

import fetchAllReferralsByOffset from './fetchAllReferralsByOffset';

interface ApiResults {
    Referrals: number[];
    Total: number;
}

describe('fetchAllReferralsByOffset', () => {
    it('Should make 1 call if total is inferior to limit', async () => {
        const apiSpy = jest.fn<Promise<ApiResults>, [Api]>(() =>
            Promise.resolve({
                Total: 10,
                Referrals: new Array(10),
            })
        );

        const { Referrals } = await fetchAllReferralsByOffset(apiSpy as Api);

        expect(apiSpy).toHaveBeenCalledTimes(1);
        expect(Referrals?.length).toBe(10);
    });

    it('Should make 2 call if total is superior to limit', async () => {
        const LIMIT = 5;
        const TOTAL = 10;
        const CALLS_NUMBER = 2;
        const apiSpy = jest.fn<Promise<ApiResults>, [Api]>(() =>
            Promise.resolve({
                Total: 10,
                Referrals: new Array(LIMIT),
            })
        );

        const { Referrals } = await fetchAllReferralsByOffset(apiSpy as Api, { Limit: LIMIT, Offset: 0 });

        expect(Referrals?.length).toBe(TOTAL);
        expect(apiSpy).toHaveBeenCalledTimes(CALLS_NUMBER);
    });

    it('Should make 5 calls (4 of 100 and 1 of 60)', async () => {
        const TOTAL = 460;
        const CALLS_NUMBER = 5;
        let calls = 0;
        const apiSpy = jest.fn<Promise<ApiResults>, [Api]>(() => {
            calls += 1;
            return Promise.resolve({
                Total: TOTAL,
                Referrals: calls < CALLS_NUMBER ? new Array(100) : new Array(60),
            });
        });

        const { Referrals } = await fetchAllReferralsByOffset(apiSpy as Api);

        expect(Referrals?.length).toBe(TOTAL);
        expect(apiSpy).toHaveBeenCalledTimes(CALLS_NUMBER);
    });
});
