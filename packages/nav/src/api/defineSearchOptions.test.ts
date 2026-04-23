import type { NavResolved } from '../types/nav';
import { defineSearchOptions } from './defineSearchOptions';

const FIXTURES = {
    flatNav: {
        items: [
            { id: 'home', label: 'Home', to: '/home', icon: 'house', children: undefined, meta: {} },
            { id: 'settings', label: 'Settings', to: '/settings', icon: undefined, children: undefined, meta: {} },
        ],
    } as const satisfies NavResolved,
    nestedNav: {
        items: [
            {
                id: 'organization',
                label: 'Organization',
                icon: 'house',
                to: undefined,
                meta: {},
                children: [
                    {
                        id: 'organization.vpn',
                        label: 'VPN',
                        icon: 'brand-proton-vpn',
                        to: undefined,
                        meta: {},
                        children: [
                            {
                                id: 'organization.vpn.gateways',
                                label: 'Gateways',
                                to: '/gateways',
                                icon: undefined,
                                children: undefined,
                                meta: {},
                            },
                            {
                                id: 'organization.vpn.shared-servers',
                                label: 'Shared servers',
                                to: '/shared-servers',
                                icon: 'servers',
                                children: undefined,
                                meta: {},
                            },
                        ],
                    },
                    {
                        id: 'organization.home',
                        label: 'Home',
                        to: '/dashboard',
                        icon: 'house',
                        children: undefined,
                        meta: {},
                    },
                ],
            },
            {
                id: 'my-account',
                label: 'My account',
                icon: 'user',
                to: undefined,
                meta: {},
                children: [
                    {
                        id: 'my-account.security',
                        label: 'Security',
                        to: '/security',
                        icon: undefined,
                        children: undefined,
                        meta: {},
                    },
                ],
            },
        ],
    } as const satisfies NavResolved,
    noIconNav: {
        items: [
            {
                id: 'section',
                label: 'Section',
                meta: {},
                icon: undefined,
                to: undefined,
                children: [
                    {
                        id: 'section.child',
                        label: 'Child',
                        meta: {},
                        to: undefined,
                        icon: undefined,
                        children: [
                            {
                                id: 'section.child.leaf',
                                label: 'Leaf',
                                children: undefined,
                                icon: undefined,
                                meta: {},
                                to: '/leaf',
                            },
                        ],
                    },
                ],
            },
        ],
    } as const satisfies NavResolved,
    mixedNav: {
        items: [
            { id: 'root-leaf', label: 'Root leaf', to: '/root', icon: 'house', children: undefined, meta: {} },
            {
                id: 'parent',
                label: 'Parent',
                to: undefined,
                icon: 'user',
                meta: {},
                children: [
                    {
                        id: 'parent.child',
                        label: 'Child',
                        to: '/child',
                        icon: undefined,
                        children: undefined,
                        meta: {},
                    },
                ],
            },
        ],
    } as const satisfies NavResolved,
};

const getTos = (nav: NavResolved) => defineSearchOptions(nav).map((r) => r.to);
const getValues = (nav: NavResolved) => defineSearchOptions(nav).map((r) => r.value);

describe('defineSearchOptions', () => {
    describe('leaf output', () => {
        it('returns one entry per leaf (item with `to` and no children)', () => {
            expect(defineSearchOptions(FIXTURES.flatNav)).toHaveLength(2);
        });

        it('does not include branch nodes as entries', () => {
            const labels = getValues(FIXTURES.nestedNav);
            expect(labels).not.toContain('Organization');
            expect(labels).not.toContain('VPN');
            expect(labels).not.toContain('My account');
        });

        it('returns a flat array regardless of nesting depth', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav);
            result.forEach((item) => expect(item).not.toHaveProperty('children'));
        });

        it('handles mixed root-level leaves and nested items', () => {
            expect(getTos(FIXTURES.mixedNav)).toEqual(['/root', '/child']);
        });

        it('returns an empty array when nav has no leaves', () => {
            const nav = {
                items: [{ id: 'section', label: 'Section', to: undefined, icon: undefined, meta: {}, children: [] }],
            } as const satisfies NavResolved;
            expect(defineSearchOptions(nav)).toEqual([]);
        });

        it('returns an empty array for empty items', () => {
            expect(defineSearchOptions({ items: [] } as const satisfies NavResolved)).toEqual([]);
        });
    });

    describe('leaf content', () => {
        it('maps label from the nav item', () => {
            const result = defineSearchOptions(FIXTURES.flatNav);
            expect(result[0].value).toBe('Home');
            expect(result[1].value).toBe('Settings');
        });

        it('maps `to` from the nav item', () => {
            const result = defineSearchOptions(FIXTURES.flatNav);
            expect(result[0].to).toBe('/home');
            expect(result[1].to).toBe('/settings');
        });

        it('sets `in` to empty array for top-level leaves', () => {
            const result = defineSearchOptions(FIXTURES.flatNav);
            expect(result[0].in).toEqual([]);
            expect(result[1].in).toEqual([]);
        });

        it('sets `in` to parent label breadcrumbs for nested leaves', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav);
            expect(result.find((r) => r.to === '/gateways')?.in).toEqual(['Organization', 'VPN']);
            expect(result.find((r) => r.to === '/security')?.in).toEqual(['My account']);
        });

        it('uses the leaf own icon when present', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav);
            expect(result.find((r) => r.to === '/shared-servers')?.icon).toBe('servers');
        });

        it('falls back to the nearest ancestor icon when the leaf has none', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav);
            expect(result.find((r) => r.to === '/gateways')?.icon).toBe('brand-proton-vpn');
        });

        it('is undefined when no icon exists anywhere in the ancestry', () => {
            const result = defineSearchOptions(FIXTURES.noIconNav);
            expect(result.find((r) => r.to === '/leaf')?.icon).toBeUndefined();
        });
    });

    describe('with sections', () => {
        it('still includes the default leaf', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways')).toBeDefined();
        });

        it('inserts the section entry directly after its leaf entry', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', to: '#privacy' }],
            });
            const defaultIdx = result.findIndex((r) => r.to === '/gateways');
            const sectionIdx = result.findIndex((r) => r.to === '/gateways#privacy');
            expect(sectionIdx).toBe(defaultIdx + 1);
        });

        it('inserts multiple sections for the same leaf consecutively after the default entry', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [
                    { value: 'Privacy', to: '#privacy' },
                    { value: 'Logs', to: '#logs' },
                ],
            });
            const defaultIdx = result.findIndex((r) => r.to === '/gateways');
            const privacyIdx = result.findIndex((r) => r.to === '/gateways#privacy');
            const logsIdx = result.findIndex((r) => r.to === '/gateways#logs');
            expect(privacyIdx).toBe(defaultIdx + 1);
            expect(logsIdx).toBe(defaultIdx + 2);
        });

        it('preserves section order as defined', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [
                    { value: 'Privacy', to: '#privacy' },
                    { value: 'Logs', to: '#logs' },
                    { value: 'Config', to: '#config' },
                ],
            });
            const tos = result.map((r) => r.to);
            expect(tos.indexOf('/gateways#privacy')).toBeLessThan(tos.indexOf('/gateways#logs'));
            expect(tos.indexOf('/gateways#logs')).toBeLessThan(tos.indexOf('/gateways#config'));
        });

        it('appends the section `to` fragment to the leaf `to`', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.to).toBe('/gateways#privacy');
        });

        it('uses the section label', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.value).toBe('Privacy');
        });

        it('includes the leaf label in `in` for the section entry', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.in).toEqual(['Organization', 'VPN', 'Gateways']);
        });

        it('leaf entry is intact when adding the section', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways')?.in).toEqual(['Organization', 'VPN']);
        });

        it('silently ignores an empty sections array for a leaf', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [],
            });
            expect(result).toHaveLength(4);
        });

        it('total length equals leaves + total number of section entries across all keys', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [
                    { value: 'Privacy', to: '#privacy' },
                    { value: 'Logs', to: '#logs' },
                ],
                'my-account.security': [{ value: 'Two factor', to: '#2fa' }],
            });
            expect(result).toHaveLength(4 + 3);
        });

        it('handles multiple leaves with sections independently', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', to: '#privacy' }],
                'my-account.security': [{ value: 'Two factor', to: '#2fa' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')).toBeDefined();
            expect(result.find((r) => r.to === '/security#2fa')).toBeDefined();
        });

        it('uses the section icon when provided', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.icon).toBe('lock');
        });

        it('falls back to the leaf icon when the section has none', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.shared-servers': [{ value: 'Config', to: '#config' }],
            });
            expect(result.find((r) => r.to === '/shared-servers#config')?.icon).toBe('servers');
        });

        it('falls back to the nearest ancestor icon when neither section nor leaf has one', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [{ value: 'Privacy', to: '#privacy' }],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.icon).toBe('brand-proton-vpn');
        });

        it('resolves icon independently for each section entry on the same leaf', () => {
            const result = defineSearchOptions(FIXTURES.nestedNav, {
                'organization.vpn.gateways': [
                    { value: 'Privacy', icon: 'lock', to: '#privacy' },
                    { value: 'Logs', to: '#logs' },
                ],
            });
            expect(result.find((r) => r.to === '/gateways#privacy')?.icon).toBe('lock');
            expect(result.find((r) => r.to === '/gateways#logs')?.icon).toBe('brand-proton-vpn');
        });
    });
});
