import { buildUser } from '@proton/account/testing/buildUser';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { type ProduceForkParametersFull, produceFork } from '@proton/shared/lib/authentication/fork/produce';
import { APPS, type APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { type UserModel, UserType } from '@proton/shared/lib/interfaces/User';

import type { AuthSession } from '../authSession';
import type { Paths } from '../helper';
import { type ProduceForkData, SSOType } from './forkInterface';
import { getProduceForkLoginResult } from './getProduceForkLoginResult';

jest.mock('@proton/shared/lib/authentication/fork/produce', () => ({
    ...jest.requireActual('@proton/shared/lib/authentication/fork/produce'),
    produceFork: jest.fn(),
    getProduceForkUrl: () => new URL('https://drive.proton.me/login#selector=fork'),
}));
jest.mock('@proton/shared/lib/authentication/fork/extension', () => ({
    ...jest.requireActual('@proton/shared/lib/authentication/fork/extension'),
    produceExtensionFork: jest.fn(async () => ({ type: 'success' })),
}));
const mockProduceFork = produceFork as jest.MockedFunction<typeof produceFork>;

const paths = { appSwitcher: '/apps' } as Paths;

const getSession = (source: SessionSource, user: Partial<UserModel>): AuthSession =>
    ({
        flow: 'login',
        data: {
            UID: 'uid',
            localID: 0,
            User: buildUser({ Subscribed: 0, ...user }),
            persistedSession: { source },
        },
    }) as unknown as AuthSession;

const getForkData = (app: APP_NAMES): ProduceForkData => ({
    type: SSOType.Proton,
    payload: { forkParameters: { app, state: 'state' } as ProduceForkParametersFull },
});

// Not private, so it isn't sent to set up keys
const ssoUserWithoutKeys: Partial<UserModel> = {
    Private: 0,
    Keys: [],
    Flags: { ...buildUser().Flags, sso: true },
};

// Managed, so it can't create a Proton address, and not private, so it isn't sent to set one up
const externalUserWithoutProtonAddressCreation: Partial<UserModel> = {
    Type: UserType.MANAGED,
    Private: 0,
    Flags: { ...buildUser().Flags, 'no-proton-address': true },
};

// Like a provisioned global SSO member: managed, with keys, and without a Proton address
const globalSSOUser: Partial<UserModel> = {
    ...externalUserWithoutProtonAddressCreation,
    Flags: { ...buildUser().Flags, sso: true, 'no-proton-address': true },
};

const setup = ({
    source = SessionSource.Proton,
    user = {},
    app,
}: {
    source?: SessionSource;
    user?: Partial<UserModel>;
    app: APP_NAMES;
}) =>
    getProduceForkLoginResult({
        // Answers the extension's push fork
        api: jest.fn(async () => ({ Selector: 'selector' })) as unknown as Api,
        data: getForkData(app),
        session: getSession(source, user),
        paths,
    });

describe('getProduceForkLoginResult', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockProduceFork.mockResolvedValue({} as Awaited<ReturnType<typeof produceFork>>);
    });

    it.each([
        ['an OAuth', SessionSource.Oauth],
        ['an MSP', SessionSource.Msp],
    ])('refuses %s session forking to an app', async (_, source) => {
        const result = await setup({ source, app: APPS.PROTONDRIVE });

        expect(result).toMatchObject({
            type: 'app-switcher',
            payload: { error: { type: 'unsupported-app', app: APPS.PROTONDRIVE } },
        });
        expect(mockProduceFork).not.toHaveBeenCalled();
    });

    it('lets an OAuth session fork to the VPN browser extension', async () => {
        const result = await setup({ source: SessionSource.Oauth, app: APPS.PROTONVPNBROWSEREXTENSION });

        expect(result.type).toBe('auth-ext');
    });

    it('forks to an app', async () => {
        const result = await setup({ app: APPS.PROTONDRIVE });

        expect(result.type).toBe('done');
        expect(mockProduceFork).toHaveBeenCalled();
    });

    it('leaves an SSO account without keys to the fork API, and shows its refusal as an unsupported app', async () => {
        mockProduceFork.mockRejectedValue({
            data: { Code: API_CUSTOM_ERROR_CODES.SSO_APPLICATION_INVALID, Error: 'This application is not supported' },
        });

        const result = await setup({ user: ssoUserWithoutKeys, app: APPS.PROTONPASS });

        expect(mockProduceFork).toHaveBeenCalled();
        expect(result).toMatchObject({
            type: 'app-switcher',
            payload: { error: { type: 'unsupported-app', app: APPS.PROTONPASS } },
        });
    });

    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONCONTACTS])(
        'sends an external account that cannot create a Proton address to ask its administrator, for %s',
        async (app) => {
            const result = await setup({ user: externalUserWithoutProtonAddressCreation, app });

            expect(result.type).toBe('done');
            const { url } = result.payload as { url: URL };
            expect(url.pathname).toContain(SETUP_ADDRESS_PATH);
            expect(url.searchParams.get('to')).toBe(app);
            expect(mockProduceFork).not.toHaveBeenCalled();
        }
    );

    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR])(
        'leaves a global SSO account forking to %s to the fork API, rather than asking its administrator',
        async (app) => {
            mockProduceFork.mockRejectedValue({
                data: {
                    Code: API_CUSTOM_ERROR_CODES.SSO_APPLICATION_INVALID,
                    Error: 'This application is not supported',
                },
            });

            const result = await setup({ user: globalSSOUser, app });

            expect(mockProduceFork).toHaveBeenCalled();
            expect(result).toMatchObject({
                type: 'app-switcher',
                payload: { error: { type: 'unsupported-app', app } },
            });
        }
    );

    it('lets an external account that cannot create a Proton address fork to Drive', async () => {
        const result = await setup({ user: externalUserWithoutProtonAddressCreation, app: APPS.PROTONDRIVE });

        expect(result.type).toBe('done');
    });
});
