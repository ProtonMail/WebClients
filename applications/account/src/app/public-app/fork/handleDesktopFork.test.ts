import { getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { Paths } from '../helper';
import { handleDesktopFork } from './handleDesktopFork';

jest.mock('@proton/shared/lib/authentication/persistedSessionHelper', () => ({
    ...jest.requireActual('@proton/shared/lib/authentication/persistedSessionHelper'),
    getActiveSessions: jest.fn(),
}));
const mockGetActiveSessions = getActiveSessions as jest.MockedFunction<typeof getActiveSessions>;

const setup = (search: string, childClientId: string) => {
    window.history.replaceState(null, '', `/desktop/login?${search}#payload=0:ABCD2345::${childClientId}`);
    return handleDesktopFork({ api: jest.fn() as unknown as Api, paths: {} as Paths });
};

const getForkParameters = async (search: string, childClientId: string) => {
    const result = await setup(search, childClientId);
    return result.payload.fork.payload.forkParameters;
};

const getPrompt = async (search: string, childClientId: string) =>
    (await getForkParameters(search, childClientId)).prompt;

describe('handleDesktopFork', () => {
    beforeEach(() => {
        mockGetActiveSessions.mockResolvedValue({ sessions: [] } as unknown as Awaited<
            ReturnType<typeof getActiveSessions>
        >);
    });

    it.each(['cli-pass', 'macos-pass', 'windows-pass', 'linux-pass', 'web-pass'])(
        'asks %s to reauth',
        async (childClientId) => {
            expect(await getPrompt('app=pass', childClientId)).toBe('login');
            expect(await getPrompt('app=proton-pass', childClientId)).toBe('login');
        }
    );

    it.each(['cli-pass', 'macos-pass'])('asks %s for the offline key in reauth', async (childClientId) => {
        expect((await getForkParameters('app=pass', childClientId)).promptType).toBe('offline');
        expect((await getForkParameters('app=pass&promptType=default', childClientId)).promptType).toBe('offline');
    });

    it('does not ask other apps to reauth', async () => {
        expect(await getPrompt('app=mail', 'macos-mail')).toBeUndefined();
        expect((await getForkParameters('app=mail', 'macos-mail')).promptType).toBe('default');
    });

    it('keeps the prompt the url asks for in other apps', async () => {
        expect(await getPrompt('app=mail&prompt=login', 'macos-mail')).toBe('login');
    });

    it.each([
        ['app=mail', 'cli-pass'],
        ['app=mail', 'macos-pass'],
        ['app=pass', 'macos-mail'],
    ])('rejects %s with %s', async (search, childClientId) => {
        await expect(setup(search, childClientId)).rejects.toThrow('ClientID and app mismatch');
    });
});
