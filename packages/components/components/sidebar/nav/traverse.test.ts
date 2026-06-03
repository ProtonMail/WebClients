import type { NavResolved } from '@proton/nav/types/nav';

import { getActiveBranches } from './traverse';

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
    it.each`
        pathname                   | expected                                | description
        ${'/unknown'}              | ${[]}                                   | ${'returns empty set when no leaf matches'}
        ${''}                      | ${[]}                                   | ${'returns empty set for an empty pathname'}
        ${'/vpn/dashboard'}        | ${['organization']}                     | ${'returns the direct parent when leaf is at L2'}
        ${'/vpn/gateways'}         | ${['organization', 'organization.vpn']} | ${'returns all ancestors when leaf is at L3'}
        ${'/vpn/recovery'}         | ${['my-account']}                       | ${'matches exactly and excludes unrelated branches'}
        ${'/vpn/recovery/email'}   | ${['my-account']}                       | ${'matches a nested path that extends beyond a registered leaf'}
        ${'/vpn/recovery/email/x'} | ${['my-account']}                       | ${'matches a deeply nested extension of a registered leaf'}
        ${'/vpn/recovery/'}        | ${['my-account']}                       | ${'matches a pathname with a trailing slash'}
        ${'/vpn/recoveryx'}        | ${[]}                                   | ${'does not match paths that share a prefix but cross a segment boundary'}
    `('$description', ({ pathname, expected }: { pathname: string; expected: string[] }) => {
        const active = getActiveBranches(routes.items, pathname);
        expect([...active].sort()).toEqual([...expected].sort());
    });

    it('prefers the most specific match when multiple items share a prefix', () => {
        const nested: NavResolved = {
            items: [
                {
                    id: 'a',
                    label: 'A',
                    to: '/vpn',
                    meta: {},
                    icon: undefined,
                    sections: undefined,
                    children: [
                        {
                            id: 'a.b',
                            label: 'B',
                            to: '/vpn/settings',
                            meta: {},
                            icon: undefined,
                            sections: undefined,
                            children: undefined,
                        },
                    ],
                },
            ],
        };
        const active = getActiveBranches(nested.items, '/vpn/settings/email');
        expect([...active].sort()).toEqual(['a']);
    });
});
