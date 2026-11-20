import { LumoApi } from './api';

const respond = (body: unknown, status: number) =>
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('LumoApi.getUserSettings', () => {
    it('returns the settings blob', async () => {
        respond({ Code: 1000, UserSettings: { UserSettingsTag: 'tag', Encrypted: 'blob' } }, 200);

        await expect(new LumoApi('session').getUserSettings()).resolves.toEqual(
            expect.objectContaining({ userSettingsTag: 'tag', encrypted: 'blob' })
        );
    });

    it('returns null for the placeholder Slim-API sends when the user has no settings', async () => {
        respond(
            {
                Code: 1000,
                UserSettings: { ID: 0, UserSettingsTag: 'new-tag', DeleteTime: null, Encrypted: null },
            },
            200
        );

        await expect(new LumoApi('session').getUserSettings()).resolves.toBeNull();
    });

    it('returns null when the response has no settings at all', async () => {
        respond({ Code: 1000 }, 200);

        await expect(new LumoApi('session').getUserSettings()).resolves.toBeNull();
    });

    it.each([503, 401, 422])('throws on HTTP %s, so it is never mistaken for an empty account', async (status) => {
        respond({}, status);

        await expect(new LumoApi('session').getUserSettings()).rejects.toThrow();
    });

    it('throws when the request itself fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(new LumoApi('session').getUserSettings()).rejects.toThrow('Failed to fetch');
    });
});
