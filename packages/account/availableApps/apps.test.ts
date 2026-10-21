import type { PLANS } from '@proton/payments/core/constants';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';
import { UserType } from '@proton/shared/lib/interfaces/User';

import { type AvailableApp, getAvailableAppsWithTiers } from './apps';

/** Every app the available apps can list */
const everyApp = [
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

const query = ({ user = {}, planName }: { user?: Partial<User>; planName?: string } = {}) =>
    getAvailableAppsWithTiers({
        apps: [...everyApp].reverse(),
        user: { Type: UserType.PROTON, Subscribed: 0, Keys: [], Flags: {}, ...user } as User,
        organization: planName ? { PlanName: planName as PLANS } : undefined,
    });

/** Each app's tier, by app */
const getTiers = (apps: AvailableApp[]) => Object.fromEntries(apps.map(({ app, tier }) => [app, tier]));

describe('getAvailableAppsWithTiers', () => {
    it('lists the available apps, without tiers on a free plan', () => {
        expect(getTiers(query())).toEqual(Object.fromEntries(everyApp.map((app) => [app, null])));
    });

    it('gives the apps the user pays for the tier of their plan', () => {
        const tiers = getTiers(query({ user: { Subscribed: PRODUCT_BIT.DRIVE }, planName: 'drive2022' }));

        expect(tiers).toMatchObject({
            [APPS.PROTONDRIVE]: 'Plus',
            [APPS.PROTONDOCS]: 'Plus',
            [APPS.PROTONSHEETS]: 'Plus',
            [APPS.PROTONMAIL]: null,
            [APPS.PROTONPASS]: null,
        });
    });

    it.each([
        ['passpro2024', 'Essentials'],
        ['passbiz2024', 'Professional'],
        ['passfamily2024', 'Family'],
    ])('gives Pass the tier of %s', (planName, tier) => {
        expect(getTiers(query({ user: { Subscribed: PRODUCT_BIT.PASS }, planName }))[APPS.PROTONPASS]).toBe(tier);
    });

    it('gives no tier with a bundle, which includes every app', () => {
        const subscribed =
            PRODUCT_BIT.MAIL |
            PRODUCT_BIT.PASS |
            PRODUCT_BIT.DRIVE |
            PRODUCT_BIT.VPN |
            PRODUCT_BIT.WALLET |
            PRODUCT_BIT.LUMO |
            PRODUCT_BIT.MEET;
        const apps = query({ user: { Subscribed: subscribed }, planName: 'bundle2022' });

        expect(apps.every(({ tier }) => tier === null)).toBe(true);
    });

    it.each([['pass-lifetime'], ['pass-from-sl']])('gives Pass the Plus tier with %s, which has no plan', (flag) => {
        const tiers = getTiers(query({ user: { Flags: { [flag]: true } as User['Flags'] } }));

        expect(tiers).toMatchObject({ [APPS.PROTONPASS]: 'Plus', [APPS.PROTONMAIL]: null });
    });

    it('gives no tier with pass-lifetime next to a bundle', () => {
        const subscribed =
            PRODUCT_BIT.MAIL |
            PRODUCT_BIT.PASS |
            PRODUCT_BIT.DRIVE |
            PRODUCT_BIT.VPN |
            PRODUCT_BIT.WALLET |
            PRODUCT_BIT.LUMO |
            PRODUCT_BIT.MEET;
        const apps = query({
            user: { Subscribed: subscribed, Flags: { 'pass-lifetime': true } as User['Flags'] },
            planName: 'bundle2022',
        });

        expect(apps.every(({ tier }) => tier === null)).toBe(true);
    });

    it("leaves out the apps that aren't available", () => {
        const apps = getAvailableAppsWithTiers({
            apps: [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS],
            user: { Type: UserType.PROTON, Subscribed: 0, Keys: [], Flags: {} } as unknown as User,
            organization: undefined,
        });

        expect(apps.map(({ app }) => app).sort()).toEqual([APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS].sort());
    });
});
