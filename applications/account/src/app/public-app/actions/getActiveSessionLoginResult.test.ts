import type { ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork/produce';
import {
    type ActiveSession,
    GetActiveSessionType,
    type GetActiveSessionsResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { getPaths } from '../helper';
import { type ProduceForkData, SSOType } from './forkInterface';
import { getActiveSessionLoginResult } from './getActiveSessionLoginResult';

const api = vi.fn() as unknown as Api;
const session = { remote: { LocalID: 1 } } as unknown as ActiveSession;

const getSessionsResult = (sessions: ActiveSession[]): GetActiveSessionsResult => ({
    type: GetActiveSessionType.Switch,
    sessions,
});

const getResult = ({ sessions, forkState }: { sessions: ActiveSession[]; forkState?: ProduceForkData }) => {
    const initialSearchParams = new URLSearchParams();
    return getActiveSessionLoginResult({
        api,
        forkState,
        sessionsResult: getSessionsResult(sessions),
        initialSearchParams,
        paths: getPaths({
            maybeLocalePrefix: 'fr',
            forkState,
            app: undefined,
            productParam: undefined,
            searchParams: initialSearchParams,
        }),
    });
};

describe('getActiveSessionLoginResult', () => {
    it('opens the account switcher in the language of the page', async () => {
        expect(await getResult({ sessions: [session] })).toEqual({
            type: 'sessions-switcher',
            payload: null,
            location: `/fr${SSO_PATHS.SWITCH}`,
        });
    });

    it('opens the login page in the language of the page without sessions', async () => {
        expect(await getResult({ sessions: [] })).toMatchObject({ location: `/fr${SSO_PATHS.LOGIN}` });
    });

    it('opens the account switcher in the language of the page for a fork', async () => {
        const forkState: ProduceForkData = {
            type: SSOType.Proton,
            payload: { forkParameters: { app: APPS.PROTONMAIL } as ProduceForkParametersFull },
        };
        expect(await getResult({ sessions: [session], forkState })).toMatchObject({
            type: 'sessions-switcher',
            location: `/fr${SSO_PATHS.SWITCH}`,
        });
    });
});
