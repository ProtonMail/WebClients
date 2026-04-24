import { describe, expect, it } from 'vitest';

import { defineNavigation } from './api/defineNavigation';
import type { NavContext } from './types/models';
import type { NavDefinition, NavItemResolver } from './types/nav';
import type { TestUserModel } from './types/test.models';

const makeContext = (user: TestUserModel, prefix?: string): NavContext => ({ user, prefix }) as unknown as NavContext;

const orgUser = makeContext({
    id: 'u1',
    email: 'user@example.com',
    roles: ['user'],
    subscription: ['vpn-professional'],
});
const orgAdmin = makeContext({
    id: 'u2',
    email: 'admin@example.com',
    roles: ['user', 'admin'],
    subscription: ['vpn-professional'],
});

const adminOrgResolver: NavItemResolver<NavContext> = ({ context, keep, remove }) =>
    (context.user as unknown as TestUserModel).roles?.includes('admin') ? keep() : remove();

const vpnProResolver: NavItemResolver<NavContext> = ({ context, keep, remove }) =>
    (context.user as unknown as TestUserModel).subscription?.includes('vpn-professional') ? keep() : remove();

const mailProResolver: NavItemResolver<NavContext> = ({ context, keep, remove }) =>
    (context.user as unknown as TestUserModel).subscription?.includes('mail-and-calendar-professional')
        ? keep()
        : remove();

const orgDefinition: NavDefinition = {
    items: [
        {
            id: 'organization',
            label: 'Organization',
            resolver: adminOrgResolver,
            children: [
                { id: 'organization.home', label: 'Home', to: '/org/home' },
                {
                    id: 'organization.org_and_people',
                    label: 'Organization and people',
                    children: [
                        { id: 'organization.org_and_people.users', label: 'Users', to: '/org/users' },
                        { id: 'organization.org_and_people.groups', label: 'Groups', to: '/org/groups' },
                        {
                            id: 'organization.org_and_people.roles_and_permissions',
                            label: 'Roles and permissions',
                            to: '/org/roles',
                        },
                        {
                            id: 'organization.org_and_people.access_control',
                            label: 'Access control',
                            to: '/org/access',
                        },
                    ],
                },
                {
                    id: 'organization.vpn',
                    label: 'VPN',
                    resolver: vpnProResolver,
                    children: [
                        {
                            id: 'organization.vpn.shared_servers',
                            label: 'Shared servers',
                            to: '/org/vpn/shared-servers',
                        },
                    ],
                },
                {
                    id: 'organization.mail',
                    label: 'Mail',
                    resolver: mailProResolver,
                    children: [
                        { id: 'organization.mail.domain_names', label: 'Domain names', to: '/org/mail/domain-names' },
                    ],
                },
            ],
        },
    ],
};

describe('org nav — non-admin user', () => {
    it('resolves to an empty nav — the entire organization section is gated to admins', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: orgUser });
        expect(nav.items).toHaveLength(0);
    });
});

describe('org nav — admin user, vpn-professional subscription', () => {
    it('includes the organization root item', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: orgAdmin });
        expect(nav.items).toHaveLength(1);
        expect(nav.items[0]?.id).toBe('organization');
    });

    it('includes all four top-level children', () => {
        const superAdmin = makeContext({
            id: 'u2',
            email: 'admin@example.com',
            roles: ['user', 'admin'],
            subscription: ['vpn-professional', 'mail-and-calendar-professional'],
        });
        const nav = defineNavigation({ definition: orgDefinition, context: superAdmin });
        const childIds = nav.items[0]?.children?.map((c) => c.id);
        expect(childIds).toEqual([
            'organization.home',
            'organization.org_and_people',
            'organization.vpn',
            'organization.mail',
        ]);
    });

    it('includes the vpn section — subscription matches', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: orgAdmin });
        const vpn = nav.items[0]?.children?.find((c) => c.id === 'organization.vpn');
        expect(vpn).toBeDefined();
        expect(vpn?.children?.map((c) => c.id)).toEqual(['organization.vpn.shared_servers']);
    });

    it('excludes the mail section — subscription does not match', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: orgAdmin });
        const mail = nav.items[0]?.children?.find((c) => c.id === 'organization.mail');
        expect(mail).toBeUndefined();
    });

    it('includes all four org_and_people children — no resolver gates them', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: orgAdmin });
        const orgAndPeople = nav.items[0]?.children?.find((c) => c.id === 'organization.org_and_people');
        expect(orgAndPeople?.children?.map((c) => c.id)).toEqual([
            'organization.org_and_people.users',
            'organization.org_and_people.groups',
            'organization.org_and_people.roles_and_permissions',
            'organization.org_and_people.access_control',
        ]);
    });
});

describe('org nav — admin user, mail-and-calendar-professional subscription', () => {
    const mailAdmin = makeContext({
        id: 'u3',
        email: 'mailadmin@example.com',
        roles: ['user', 'admin'],
        subscription: ['mail-and-calendar-professional'],
    });

    it('includes the mail section — subscription matches', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: mailAdmin });
        const mail = nav.items[0]?.children?.find((c) => c.id === 'organization.mail');
        expect(mail).toBeDefined();
        expect(mail?.children?.map((c) => c.id)).toEqual(['organization.mail.domain_names']);
    });

    it('excludes the vpn section — subscription does not match', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: mailAdmin });
        const vpn = nav.items[0]?.children?.find((c) => c.id === 'organization.vpn');
        expect(vpn).toBeUndefined();
    });
});

describe('org nav — admin user, no product subscription', () => {
    const basicAdmin = makeContext({
        id: 'u4',
        email: 'basic@example.com',
        roles: ['user', 'admin'],
        subscription: ['basic'],
    });

    it('includes only home and org_and_people — both product sections are gated', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: basicAdmin });
        const childIds = nav.items[0]?.children?.map((c) => c.id);
        expect(childIds).toEqual(['organization.home', 'organization.org_and_people']);
    });
});

describe('org nav — prefix routing', () => {
    const prefixAdmin = makeContext(
        { id: 'u2', email: 'admin@example.com', roles: ['user', 'admin'], subscription: ['vpn-professional'] },
        '/tenant-slug'
    );

    it('prepends prefix to all resolved `to` paths', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: prefixAdmin });
        const home = nav.items[0]?.children?.find((c) => c.id === 'organization.home');
        expect(home?.to).toBe('/tenant-slug/org/home');
    });

    it('prepends prefix to deeply nested children', () => {
        const nav = defineNavigation({ definition: orgDefinition, context: prefixAdmin });
        const vpn = nav.items[0]?.children?.find((c) => c.id === 'organization.vpn');
        expect(vpn?.children?.[0]?.to).toBe('/tenant-slug/org/vpn/shared-servers');
    });
});
