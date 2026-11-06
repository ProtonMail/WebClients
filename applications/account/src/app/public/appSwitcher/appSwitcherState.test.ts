import { queryAvailableAppsWithTiers, unauthenticatedApps } from '@proton/account/availableApps/apps';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { User } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import type { AuthSession } from '../../content/authSession';
import { getAppSwitcherState } from './appSwitcherState';

jest.mock('@proton/account/availableApps/apps', () => ({
    ...jest.requireActual('@proton/account/availableApps/apps'),
    queryAvailableAppsWithTiers: jest.fn(),
}));
const mockQueryAvailableAppsWithTiers = queryAvailableAppsWithTiers as jest.MockedFunction<
    typeof queryAvailableAppsWithTiers
>;

const getSession = (forbiddenProducts: User['ForbiddenProducts'] = []) =>
    ({ data: { User: buildUser({ Subscribed: 0, ForbiddenProducts: forbiddenProducts }) } }) as unknown as AuthSession;

describe('getAppSwitcherState', () => {
    it('lists the apps anyone sees when the available apps request fails', async () => {
        mockQueryAvailableAppsWithTiers.mockRejectedValue(new Error('Offline'));

        const { availableApps } = await getAppSwitcherState({ session: getSession(), api: jest.fn() as Api });

        expect(availableApps.map(({ app }) => app)).toEqual(unauthenticatedApps);
    });

    it('leaves the forbidden apps out of that list, since the app switcher shows them disabled', async () => {
        mockQueryAvailableAppsWithTiers.mockRejectedValue(new Error('Offline'));

        const { availableApps } = await getAppSwitcherState({
            session: getSession([Product.Drive]),
            api: jest.fn() as Api,
        });

        const apps = availableApps.map(({ app }) => app);
        expect(apps).not.toContain(APPS.PROTONDRIVE);
        expect(apps).not.toContain(APPS.PROTONDOCS);
        expect(apps).not.toContain(APPS.PROTONSHEETS);
        expect(apps).toContain(APPS.PROTONMAIL);
    });
});
