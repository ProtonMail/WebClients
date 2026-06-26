import { fetchUsageLimits, LUMO_LIMITS_ENDPOINT } from './network';

describe('fetchUsageLimits', () => {
    it('calls GET ai/v1/limits and returns limits', async () => {
        const limits = { lite: 99, max: 20, images: 19 };
        const api = jest.fn().mockResolvedValue({ limits });

        await expect(fetchUsageLimits(api)).resolves.toEqual(limits);
        expect(api).toHaveBeenCalledWith({
            url: LUMO_LIMITS_ENDPOINT,
            method: 'get',
            silence: true,
        });
    });
});
