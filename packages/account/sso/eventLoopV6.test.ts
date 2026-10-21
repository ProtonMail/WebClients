import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import { ActionEventV6, type CoreEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { AuthDeviceOutput, MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';

import type { CoreEventLoopV6RequiredState } from '../coreEventLoop/interface';
import { type DomainsState, domainsReducer } from '../domains';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { authDevicesReducer } from './authDevices';
import { authDevicesLoop } from './eventLoopV6';
import { memberAuthDevicesReducer } from './memberAuthDevices';

const AUTH_DEVICES_URL = 'auth/v4/devices';
const MEMBER_AUTH_DEVICES_URL = 'core/v4/members/devices/pending';

const authDevice = (ID: string, Name = 'Before') => ({ ID, Name }) as AuthDeviceOutput;
const memberAuthDevice = (ID: string, Name = 'Before') =>
    ({ ID, MemberID: 'member-id', Name }) as MemberAuthDeviceOutput;

const anEvent = (event: Partial<CoreEventV6Response>) => event as CoreEventV6Response;
const update = (ID: string) => ({ ID, Action: ActionEventV6.Update });

describe('authDevicesLoop', () => {
    const setup = ({ loaded }: { loaded: boolean }) => {
        const api = jest.fn().mockImplementation(({ url }: { url: string }) => {
            if (url === AUTH_DEVICES_URL) {
                return Promise.resolve({ AuthDevices: [authDevice('listed')] });
            }
            if (url === MEMBER_AUTH_DEVICES_URL) {
                return Promise.resolve({ MemberAuthDevices: [memberAuthDevice('listed')] });
            }
            const [, memberDeviceID] = url.match(/^core\/v4\/members\/devices\/(.+)$/) || [];
            if (memberDeviceID) {
                return Promise.resolve({ MemberAuthDevice: memberAuthDevice(memberDeviceID, 'After') });
            }
            const [, deviceID] = url.match(/^auth\/v4\/devices\/(.+)$/) || [];
            if (deviceID) {
                return Promise.resolve({ AuthDevice: authDevice(deviceID, 'After') });
            }
            return Promise.reject(new Error(`unexpected url ${url}`));
        });

        const { store } = getTestStore({
            reducer: { ...userReducer, ...domainsReducer, ...authDevicesReducer, ...memberAuthDevicesReducer },
            preloadedState: {
                // A global SSO admin of an organization with an SSO domain, who can list both kinds of devices
                user: getModelState({ Flags: { sso: true }, Keys: [{}], isAdmin: true } as unknown as UserModel),
                domains: getModelState([
                    { Flags: { 'sso-intent': true } },
                ] as unknown as Domain[]) as DomainsState['domains'],
                authDevices: loaded
                    ? getModelState([authDevice('a'), authDevice('b')])
                    : getInitialModelState<AuthDeviceOutput[]>(),
                memberAuthDevices: loaded
                    ? getModelState([memberAuthDevice('a'), memberAuthDevice('b')])
                    : getInitialModelState<MemberAuthDeviceOutput[]>(),
            },
            extraThunkArguments: { api } as unknown as ProtonThunkArguments,
        });

        const fire = (event: Partial<CoreEventV6Response>) =>
            authDevicesLoop({
                event: anEvent(event),
                state: store.getState() as unknown as CoreEventLoopV6RequiredState,
                dispatch: store.dispatch,
                api: api as unknown as Api,
            });

        const urlsCalled = () => api.mock.calls.map(([request]: [{ url: string }]) => request.url);

        return { store, fire, urlsCalled };
    };

    it('ignores an event without auth device changes', () => {
        const { fire, urlsCalled } = setup({ loaded: true });

        expect(fire({ AuthDevices: [], MemberAuthDevices: null })).toBeUndefined();
        expect(urlsCalled()).toEqual([]);
    });

    it('ignores auth device changes before the devices have been loaded', () => {
        const { fire, urlsCalled } = setup({ loaded: false });

        expect(fire({ AuthDevices: [update('a')], MemberAuthDevices: [update('a')] })).toBeUndefined();
        expect(urlsCalled()).toEqual([]);
    });

    it('gets the changed auth devices and removes the deleted ones', async () => {
        const { store, fire, urlsCalled } = setup({ loaded: true });

        await fire({
            AuthDevices: [
                update('a'),
                { ID: 'b', Action: ActionEventV6.Delete },
                { ID: 'c', Action: ActionEventV6.Create },
            ],
        });

        expect(urlsCalled()).toEqual([`${AUTH_DEVICES_URL}/a`, `${AUTH_DEVICES_URL}/c`]);
        expect(store.getState().authDevices.value).toEqual([authDevice('a', 'After'), authDevice('c', 'After')]);
        expect(store.getState().memberAuthDevices.value).toEqual([memberAuthDevice('a'), memberAuthDevice('b')]);
    });

    it('gets the changed member auth devices and removes the deleted ones', async () => {
        const { store, fire, urlsCalled } = setup({ loaded: true });

        await fire({ MemberAuthDevices: [update('a'), { ID: 'b', Action: ActionEventV6.Delete }] });

        expect(urlsCalled()).toEqual(['core/v4/members/devices/a']);
        expect(store.getState().memberAuthDevices.value).toEqual([memberAuthDevice('a', 'After')]);
        expect(store.getState().authDevices.value).toEqual([authDevice('a'), authDevice('b')]);
    });

    it('refetches the lists when many devices changed', async () => {
        const { store, fire, urlsCalled } = setup({ loaded: true });
        const manyUpdates = ['1', '2', '3', '4', '5', '6', '7'].map(update);

        await fire({ AuthDevices: manyUpdates, MemberAuthDevices: manyUpdates });

        expect(urlsCalled()).toEqual([AUTH_DEVICES_URL, MEMBER_AUTH_DEVICES_URL]);
        expect(store.getState().authDevices.value).toEqual([authDevice('listed')]);
        expect(store.getState().memberAuthDevices.value).toEqual([memberAuthDevice('listed')]);
    });
});
