import { IcKey } from '@proton/icons/icons/IcKey';
import { IcUser } from '@proton/icons/icons/IcUser';
import { APPS } from '@proton/shared/lib/constants';

import { getSearchableItems } from './SettingsSearch';
import type { getRoutes } from './routes';

type Routes = ReturnType<typeof getRoutes>;

const getTestRoutes = () =>
    ({
        account: {
            header: 'Account',
            routes: {
                password: {
                    id: 'password',
                    text: 'Account and password',
                    to: '/account-password',
                    icon: IcUser,
                    subsections: [
                        {
                            text: 'Two-factor authentication',
                            id: 'two-fa',
                            keywords: ['Authenticator app', 'Security key'],
                        },
                        // No text, but still reachable through its keywords
                        { text: '', id: 'account', keywords: ['Username'] },
                        { text: 'Hidden', id: 'hidden', available: false, keywords: ['Never surfaced'] },
                    ],
                },
                recovery: {
                    id: 'recovery',
                    text: 'Recovery',
                    to: '/recovery',
                    icon: IcKey,
                    subrouteGroups: {
                        advancedRecovery: {
                            id: 'advanced-recovery-options',
                            title: 'Advanced recovery options',
                            subroutes: {
                                qrCode: {
                                    id: 'qr-code',
                                    text: 'QR code sign-in',
                                    to: '/qr-code',
                                    keywords: ['Scan QR code', 'QR code sign-in'],
                                },
                            },
                        },
                    },
                },
            },
        },
    }) as unknown as Routes;

describe('getSearchableItems', () => {
    it('turns subsection keywords into search options pointing at the subsection anchor', () => {
        const items = getSearchableItems(getTestRoutes(), APPS.PROTONACCOUNT);

        expect(items).toContainEqual({
            value: 'Authenticator app',
            in: ['Account', 'Account and password', 'Two-factor authentication'],
            to: '/account-password#two-fa',
            icon: IcUser,
        });
        expect(items).toContainEqual({
            value: 'Username',
            in: ['Account', 'Account and password'],
            to: '/account-password#account',
            icon: IcUser,
        });
    });

    it('turns subroute keywords into search options pointing at the subroute path', () => {
        const items = getSearchableItems(getTestRoutes(), APPS.PROTONACCOUNT);

        expect(items).toContainEqual({
            value: 'Scan QR code',
            in: ['Account', 'Recovery', 'QR code sign-in'],
            to: '/recovery/qr-code',
            icon: IcKey,
        });
    });

    it('does not surface keywords of unavailable subsections', () => {
        const items = getSearchableItems(getTestRoutes(), APPS.PROTONACCOUNT);

        expect(items.map(({ value }) => value)).not.toContain('Never surfaced');
    });

    it('drops keywords that duplicate a title of the same section', () => {
        const items = getSearchableItems(getTestRoutes(), APPS.PROTONACCOUNT);

        expect(items.filter(({ value }) => value === 'QR code sign-in')).toHaveLength(1);
    });

    it('lists every title before any keyword so keywords cannot crowd out titles', () => {
        const items = getSearchableItems(getTestRoutes(), APPS.PROTONACCOUNT);
        const titles = ['Account and password', 'Two-factor authentication', 'Recovery', 'QR code sign-in'];

        const lastTitleIndex = Math.max(...titles.map((title) => items.findIndex(({ value }) => value === title)));
        const firstKeywordIndex = items.findIndex(({ value }) => value === 'Authenticator app');

        expect(lastTitleIndex).toBeLessThan(firstKeywordIndex);
    });
});
