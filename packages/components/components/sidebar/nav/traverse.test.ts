import type { NavResolved } from '@proton/nav/types/nav';

import { findActiveBranches } from './traverse';

const routes: NavResolved = {
    items: [
        {
            id: 'organization',
            label: 'Organization',
            meta: {},
            to: undefined,
            icon: undefined,
            sections: undefined,
            children: [
                {
                    id: 'organization.home',
                    label: 'Home',
                    icon: 'house',
                    to: '/vpn/dashboard',
                    meta: {},
                    children: undefined,
                    sections: undefined,
                },
                {
                    id: 'organization.vpn',
                    label: 'VPN',
                    icon: 'brand-proton-vpn-filled',
                    meta: {},
                    to: undefined,
                    sections: undefined,
                    children: [
                        {
                            id: 'organization.vpn.gateways',
                            label: 'Gateways',
                            to: '/vpn/gateways',
                            meta: {},
                            children: undefined,
                            icon: undefined,
                            sections: undefined,
                        },
                        {
                            id: 'organization.vpn.shared-servers',
                            label: 'Shared servers',
                            to: '/vpn/shared-servers',
                            meta: {},
                            children: undefined,
                            icon: undefined,
                            sections: undefined,
                        },
                    ],
                },
            ],
        },
        {
            id: 'my-account',
            label: 'My account',
            to: undefined,
            meta: {},
            icon: undefined,
            sections: undefined,
            children: [
                {
                    id: 'my-account.recovery',
                    label: 'Recovery',
                    to: '/vpn/recovery',
                    meta: {},
                    children: undefined,
                    icon: undefined,
                    sections: undefined,
                },
            ],
        },
    ],
};

describe('findActiveBranches', () => {
    it('returns empty set when no leaf matches', () => {
        const active = findActiveBranches(routes.items, '/unknown');
        expect(active.size).toBe(0);
    });

    it('returns the direct parent when leaf is at L2', () => {
        const active = findActiveBranches(routes.items, '/vpn/dashboard');
        expect(active).toContain('organization');
        expect(active.size).toBe(1);
    });

    it('returns all ancestors when leaf is at L3', () => {
        const active = findActiveBranches(routes.items, '/vpn/gateways');
        expect(active).toContain('organization');
        expect(active).toContain('organization.vpn');
        expect(active.size).toBe(2);
    });

    it('does not include the leaf id itself', () => {
        const active = findActiveBranches(routes.items, '/vpn/gateways');
        expect(active).not.toContain('organization.vpn.gateways');
    });

    it('does not include unrelated branches', () => {
        const active = findActiveBranches(routes.items, '/vpn/recovery');
        expect(active).toContain('my-account');
        expect(active).not.toContain('organization');
    });
});
