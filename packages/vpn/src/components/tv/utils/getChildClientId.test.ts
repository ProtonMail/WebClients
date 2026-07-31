import { getChildClientId } from './getChildClientId';

describe('getChildClientId', () => {
    const locationSave = {};

    beforeEach(() => {
        Object.assign(locationSave, {
            pathname: location.pathname,
            search: location.search,
        });
    });

    afterEach(() => {
        Object.assign(location, locationSave);
    });

    it.each`
        clientId            | pathname      | search
        ${'android_tv-vpn'} | ${''}         | ${''}
        ${'android_tv-vpn'} | ${'/'}        | ${''}
        ${'android_tv-vpn'} | ${'/tv'}      | ${''}
        ${'android_tv-vpn'} | ${'/foo'}     | ${'?clientId=bar'}
        ${'apple_tv-vpn'}   | ${'/appletv'} | ${''}
        ${'vega_tv-vpn'}    | ${'/firetv'}  | ${''}
        ${'apple_tv-vpn'}   | ${'/tv'}      | ${'?clientId=apple_tv-vpn'}
        ${'vega_tv-vpn'}    | ${'/tv'}      | ${'?clientId=vega_tv-vpn'}
        ${'android_tv-vpn'} | ${'/tv'}      | ${'?clientId=android_tv-vpn'}
        ${'apple_tv-vpn'}   | ${'/appletv'} | ${'?clientId=vega_tv-vpn'}
        ${'vega_tv-vpn'}    | ${'/firetv'}  | ${'?clientId=android_tv-vpn'}
        ${'vega_tv-vpn'}    | ${'/firetv'}  | ${'?clientId=android-vpn'}
    `('return $clientId when URL is $pathname$search', ({ clientId, pathname, search }) => {
        Object.assign(location, { pathname, search });
        expect(getChildClientId()).toBe(clientId);
    });
});
