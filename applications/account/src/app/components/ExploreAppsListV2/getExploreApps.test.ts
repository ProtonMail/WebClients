import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';

import { getExploreApps } from './ExploreAppsListV2';

// Mock getAvailableApps to return all apps
jest.mock('@proton/shared/lib/apps/apps', () => ({
    getAvailableApps: () => [
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
    ],
}));

const createMockUser = (overrides: Partial<User> = {}): User => {
    return {
        ID: 'test-user-id',
        Name: 'Test User',
        Type: UserType.PROTON,
        Subscribed: 0,
        Keys: [],
        Flags: {} as User['Flags'],
        ...overrides,
    } as User;
};

const defaultOptions = {
    isDocsHomepageAvailable: true,
    isMeetAvailable: true,
    isSheetsAvailable: true,
    isAuthenticatorAvailable: true,
};

const getAppNames = (apps: ReturnType<typeof getExploreApps>) => apps.map((app) => app.name);

describe('getExploreApps', () => {
    describe('sorting behavior', () => {
        it('should maintain original order when user has no subscriptions', () => {
            const user = createMockUser();
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names).toEqual([
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
            ]);
        });

        it('should move Meet to front when user has paid Meet', () => {
            const user = createMockUser({ Subscribed: PRODUCT_BIT.MEET });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names[0]).toBe(APPS.PROTONMEET);
        });

        it('should move Drive, Docs, and Sheets to front when user has paid Drive', () => {
            const user = createMockUser({ Subscribed: PRODUCT_BIT.DRIVE, Type: UserType.EXTERNAL });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names[0]).toBe(APPS.PROTONDRIVE);
            expect(names[1]).toBe(APPS.PROTONDOCS);
            expect(names[2]).toBe(APPS.PROTONSHEETS);

            expect(names[names.length - 2]).toBe(APPS.PROTONMAIL);
            expect(names[names.length - 1]).toBe(APPS.PROTONCALENDAR);
        });

        it('should push Mail and Calendar to end for external users', () => {
            const user = createMockUser({
                Type: UserType.EXTERNAL,
            });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names[names.length - 2]).toBe(APPS.PROTONMAIL);
            expect(names[names.length - 1]).toBe(APPS.PROTONCALENDAR);
        });

        it('should keep Mail and Calendar in original order for external users when user has paid Mail', () => {
            const user = createMockUser({
                Type: UserType.EXTERNAL,
                Subscribed: PRODUCT_BIT.MAIL,
            });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names[0]).toBe(APPS.PROTONMAIL);
            expect(names[1]).toBe(APPS.PROTONCALENDAR);
        });

        it('should move Drive, Docs, and Sheets to front when user has paid Drive', () => {
            const user = createMockUser({ Subscribed: PRODUCT_BIT.DRIVE });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            expect(names[0]).toBe(APPS.PROTONDRIVE);
            expect(names[1]).toBe(APPS.PROTONDOCS);
            expect(names[2]).toBe(APPS.PROTONSHEETS);
        });

        it('should handle Pass Lifetime users', () => {
            const user = createMockUser({
                Flags: { 'pass-lifetime': true } as User['Flags'],
            });
            const apps = getExploreApps({ ...defaultOptions, user });
            const names = getAppNames(apps);

            // Pass should be moved to front
            expect(names[0]).toBe(APPS.PROTONPASS);
        });
    });
});
