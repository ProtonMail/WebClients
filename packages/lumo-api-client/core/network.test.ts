import { LUMO_LIMITS_ENDPOINT, LUMO_MODELS_ENDPOINT, fetchModels, fetchUsageLimits } from './network';

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

describe('fetchModels', () => {
    it('calls GET ai/v1/models and returns model entries', async () => {
        const data = [
            {
                object: 'model' as const,
                id: 'lumo-lite',
                created: 1,
                owned_by: 'proton',
                max_context_length: 262_144,
            },
        ];
        const api = jest.fn().mockResolvedValue({ object: 'list', data });

        await expect(fetchModels(api)).resolves.toEqual(data);
        expect(api).toHaveBeenCalledWith({
            url: LUMO_MODELS_ENDPOINT,
            method: 'get',
            silence: true,
        });
    });
});
