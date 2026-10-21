import type { AvailableApp, AvailableAppName } from '@proton/account/availableApps/apps';
import { APPS } from '@proton/shared/lib/constants';
import { type User, UserType } from '@proton/shared/lib/interfaces/User';

import { getExploreApps } from './exploreApps';

/** The explore apps list's own order */
const exploreOrder: AvailableAppName[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONPASS,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONLUMO,
    APPS.PROTONDRIVE,
    APPS.PROTONDOCS,
    APPS.PROTONSHEETS,
    APPS.PROTONMEET,
    APPS.PROTONWALLET,
    APPS.PROTONSPACES,
];

const createUser = (overrides: Partial<User> = {}) =>
    ({ Type: UserType.PROTON, Subscribed: 0, Keys: [], Flags: {}, ...overrides }) as User;

/** Every app in another order, which the list doesn't follow, with the given ones on a Plus plan */
const getAvailableApps = (...withTier: AvailableAppName[]): AvailableApp[] =>
    [...exploreOrder].reverse().map((app) => ({ app, tier: withTier.includes(app) ? 'Plus' : null }));

const getNames = (apps: AvailableApp[], user = createUser()) => getExploreApps(apps, user).map(({ name }) => name);

describe('getExploreApps', () => {
    it('lists the apps in its own order when none has a tier', () => {
        expect(getNames(getAvailableApps())).toEqual(exploreOrder);
    });

    it('lists the apps with a tier first, keeping its order within each group', () => {
        const names = getNames(getAvailableApps(APPS.PROTONSHEETS, APPS.PROTONDRIVE, APPS.PROTONDOCS));

        expect(names.slice(0, 3)).toEqual([APPS.PROTONDRIVE, APPS.PROTONDOCS, APPS.PROTONSHEETS]);
    });

    it('lists Mail and Calendar last for an external account', () => {
        const names = getNames(getAvailableApps(), createUser({ Type: UserType.EXTERNAL }));

        expect(names.slice(-2)).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    });

    it('keeps Mail and Calendar first for an external account with a BYOE address', () => {
        const user = createUser({ Type: UserType.EXTERNAL, Flags: { 'has-a-byoe-address': true } as User['Flags'] });

        expect(getNames(getAvailableApps(), user).slice(0, 2)).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    });

    it('keeps Mail and Calendar first for an external account whose plan gives them a tier', () => {
        const names = getNames(
            getAvailableApps(APPS.PROTONMAIL, APPS.PROTONCALENDAR),
            createUser({ Type: UserType.EXTERNAL })
        );

        expect(names.slice(0, 2)).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    });

    it('lists only the available apps, with their tier', () => {
        const apps = getExploreApps(
            [
                { app: APPS.PROTONVPN_SETTINGS, tier: null },
                { app: APPS.PROTONPASS, tier: 'Professional' },
            ],
            createUser()
        );

        expect(apps.map(({ name, tier }) => ({ name, tier }))).toEqual([
            { name: APPS.PROTONPASS, tier: 'Professional' },
            { name: APPS.PROTONVPN_SETTINGS, tier: null },
        ]);
    });
});
