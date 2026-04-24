import { describe, expect, it, vi } from 'vitest';

import { DuplicateNavIdError, NavError } from '../errors';
import type { NavContext } from '../types/models';
import type { NavDefinition, NavItemResolver } from '../types/nav';
import type { TestUserModel } from '../types/test.models';
import { defineNavigation } from './defineNavigation';

const makeContext = (user: TestUserModel, prefix?: string): NavContext => ({ user, prefix }) as unknown as NavContext;

const baseContext = makeContext({ id: 'u1', email: 'user@example.com' });

const flatConfig: NavDefinition = {
    items: [
        { id: 'home', label: 'Home', to: '/' },
        { id: 'about', label: 'About', to: '/about' },
    ],
};

describe('defineNavigation', () => {
    it('returns an object with an items array', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav).toHaveProperty('items');
        expect(Array.isArray(nav.items)).toBe(true);
    });

    it('preserves item order from the definition', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items.map((i) => i.id)).toEqual(['home', 'about']);
    });

    it('maps id, label and to onto each resolved item', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items[0]).toMatchObject({ id: 'home', label: 'Home', to: '/' });
    });

    it('omits to when not provided in the definition', () => {
        const definition: NavDefinition = {
            items: [{ id: 'group', label: 'Group' }],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0].to).toBeUndefined();
    });

    it('sets meta to an empty object when not provided in the definition', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items[0].meta).toEqual({});
    });

    it('preserves meta when provided in the definition', () => {
        const definition: NavDefinition = {
            items: [{ id: 'home', label: 'Home', meta: { badge: 'new' } }],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0].meta).toEqual({ badge: 'new' });
    });

    it('resolves a label defined as a function', () => {
        const definition: NavDefinition = {
            items: [{ id: 'home', label: () => 'Computed Home' }],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0].label).toBe('Computed Home');
    });

    it('leaves icon undefined when not provided', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items[0].icon).toBeUndefined();
    });
});

describe('defineNavigation — prefix', () => {
    it('prepends prefix to `to` when context.prefix is set', () => {
        const context = makeContext({ id: 'u1', email: 'user@example.com' }, '/app');
        const definition: NavDefinition = {
            items: [{ id: 'home', label: 'Home', to: '/' }],
        };
        const nav = defineNavigation({ definition, context });
        expect(nav.items[0].to).toBe('/app/');
    });

    it('does not modify `to` when context.prefix is undefined', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items[0].to).toBe('/');
    });

    it('does not modify `to` when item has no `to`', () => {
        const context = makeContext({ id: 'u1', email: 'user@example.com' }, '/app');
        const definition: NavDefinition = {
            items: [{ id: 'group', label: 'Group' }],
        };
        const nav = defineNavigation({ definition, context });
        expect(nav.items[0].to).toBeUndefined();
    });

    it('applies prefix to nested children', () => {
        const context = makeContext({ id: 'u1', email: 'user@example.com' }, '/app');
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [{ id: 'account.settings', label: 'Settings', to: '/account/settings' }],
                },
            ],
        };
        const nav = defineNavigation({ definition, context });
        expect(nav.items[0]?.children?.[0]?.to).toBe('/app/account/settings');
    });
});

describe('defineNavigation — nested children', () => {
    it('resolves children and attaches them to the parent', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [
                        { id: 'account.settings', label: 'Settings', to: '/account/settings' },
                        { id: 'account.security', label: 'Security', to: '/account/security' },
                    ],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.children).toHaveLength(2);
        expect(nav.items[0]?.children?.[0]?.id).toBe('account.settings');
    });

    it('omits children from the resolved item when the definition has none', () => {
        const nav = defineNavigation({ definition: flatConfig, context: baseContext });
        expect(nav.items[0].children).toBeUndefined();
    });

    it('omits children from the resolved item when all children are removed by resolvers', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [{ id: 'account.settings', label: 'Settings', resolver: ({ remove }) => remove() }],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0].children).toBeUndefined();
    });

    it('preserves prefix after resolver updates `to`', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    to: '/account',
                    resolver: ({ update }) => update({ to: '/new-account' }),
                },
            ],
        };
        const nav = defineNavigation({
            definition,
            context: makeContext({ id: 'u1', email: 'user@example.com' }, '/prefix'),
        });
        expect(nav.items[0].to).toBe('/prefix/new-account');
    });

    it('resolves very deep nesting', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'l1',
                    label: 'Level 1',
                    children: [
                        {
                            id: 'l2',
                            label: 'Level 2',
                            children: [{ id: 'l3', label: 'Level 3', to: '/deep' }],
                        },
                    ],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.children?.[0]?.children?.[0]?.id).toBe('l3');
    });
});

describe('defineNavigation — keep', () => {
    it('includes the item unchanged', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    to: '/',
                    resolver: ({ keep }) => keep(),
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items).toHaveLength(1);
        expect(nav.items[0]).toMatchObject({ id: 'home', label: 'Home', to: '/' });
    });
});

describe('defineNavigation — remove', () => {
    it('excludes the item from the resolved tree', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home', to: '/' },
                { id: 'admin', label: 'Admin', to: '/admin', resolver: ({ remove }) => remove() },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items.map((i) => i.id)).toEqual(['home']);
    });

    it('excludes a child item without affecting the parent or sibling', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [
                        { id: 'account.settings', label: 'Settings', to: '/account/settings' },
                        { id: 'account.danger', label: 'Danger Zone', resolver: ({ remove }) => remove() },
                    ],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.children?.map((c) => c.id)).toEqual(['account.settings']);
    });

    it('resolvers run bottom-up — children are resolved before their parent', () => {
        const order: string[] = [];
        const definition: NavDefinition = {
            items: [
                {
                    id: 'parent',
                    label: 'Parent',
                    resolver: ({ item, keep, remove }) => {
                        order.push(item.id);
                        return item.children?.length ? keep() : remove();
                    },
                    children: [
                        {
                            id: 'child',
                            label: 'Child',
                            resolver: ({ item, keep }) => {
                                order.push(item.id);
                                return keep();
                            },
                        },
                    ],
                },
            ],
        };
        defineNavigation({ definition, context: baseContext });
        expect(order).toEqual(['child', 'parent']);
    });

    it('parent removes itself when all children are removed', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    resolver: ({ remove }) => remove(),
                    children: [{ id: 'account.hidden', label: 'Hidden', resolver: ({ remove }) => remove() }],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items).toHaveLength(0);
    });
});

describe('defineNavigation — update', () => {
    it('merges the patch onto the item', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    to: '/',
                    resolver: ({ update }) => update({ label: 'Dashboard' }),
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.label).toBe('Dashboard');
        expect(nav.items[0]?.to).toBe('/');
    });

    it('updates `to` based on a context flag', () => {
        type AppContext = NavContext & { flags: string[] };

        const makeAppContext = (flags: string[]): AppContext =>
            ({ user: { id: 'u1', email: 'user@example.com' }, prefix: undefined, flags }) as unknown as AppContext;

        const definition: NavDefinition<AppContext> = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    resolver: ({ context, update }) =>
                        update({ to: context.flags.includes('settings-v2') ? '/settings-v2' : '/settings' }),
                },
            ],
        };

        const withFlag = defineNavigation<AppContext>({ definition, context: makeAppContext(['settings-v2']) });
        expect(withFlag.items[0]?.to).toBe('/settings-v2');

        const withoutFlag = defineNavigation<AppContext>({ definition, context: makeAppContext([]) });
        expect(withoutFlag.items[0]?.to).toBe('/settings');
    });

    it('shallowly merges meta when the patch includes a meta key', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    meta: { badge: 'old', count: 1 },
                    resolver: ({ update }) => update({ meta: { badge: 'new' } }),
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.meta).toEqual({ badge: 'new', count: 1 });
    });

    it('does not affect meta when patch does not include meta', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    meta: { badge: 'kept' },
                    resolver: ({ update }) => update({ label: 'Updated' }),
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items[0]?.meta).toEqual({ badge: 'kept' });
    });
});

describe('defineNavigation — resolver context', () => {
    type AppContext = NavContext & {
        tenant: { plan: 'free' | 'pro' };
        flags: string[];
    };

    const makeAppContext = (plan: 'free' | 'pro', flags: string[] = []): AppContext =>
        ({
            user: { id: 'u1', email: 'user@example.com' },
            prefix: undefined,
            tenant: { plan },
            flags,
        }) as unknown as AppContext;

    const proContext = makeAppContext('pro', ['beta']);
    const freeContext = makeAppContext('free');

    it('resolver receives the full context at runtime', () => {
        const definition: NavDefinition<AppContext> = {
            items: [
                {
                    id: 'billing',
                    label: 'Billing',
                    resolver: ({ context, keep, remove }) => (context.tenant.plan === 'pro' ? keep() : remove()),
                },
            ],
        };
        expect(defineNavigation<AppContext>({ definition, context: proContext }).items).toHaveLength(1);
        expect(defineNavigation<AppContext>({ definition, context: freeContext }).items).toHaveLength(0);
    });

    it('a resolver typed to a context slice is assignable into NavDefinition<AppContext>', () => {
        const billingResolver: NavItemResolver<NavContext & { tenant: { plan: 'free' | 'pro' } }> = ({
            context,
            keep,
            remove,
        }) => (context.tenant.plan === 'pro' ? keep() : remove());

        const definition: NavDefinition<AppContext> = {
            items: [{ id: 'billing', label: 'Billing', resolver: billingResolver }],
        };

        expect(defineNavigation<AppContext>({ definition, context: proContext }).items).toHaveLength(1);
    });

    it('resolver can update fields based on context values', () => {
        const definition: NavDefinition<AppContext> = {
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    resolver: ({ context, update }) =>
                        update({ label: context.flags.includes('beta') ? 'Home (Beta)' : 'Home' }),
                },
            ],
        };
        const nav = defineNavigation<AppContext>({ definition, context: proContext });
        expect(nav.items[0]?.label).toBe('Home (Beta)');
    });

    it('resolver receives the already-resolved children on the item', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'parent',
                    label: 'Parent',
                    resolver: ({ item, keep, remove }) => (item.children?.length ? keep() : remove()),
                    children: [{ id: 'child', label: 'Child' }],
                },
            ],
        };
        const nav = defineNavigation({ definition, context: baseContext });
        expect(nav.items).toHaveLength(1);
        expect(nav.items[0].children?.[0].id).toBe('child');
    });
});

describe('defineNavigation — duplicate ids', () => {
    it('throws DuplicateNavIdError when two top-level items share an id', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home' },
                { id: 'home', label: 'Home Duplicate' },
            ],
        };
        expect(() => defineNavigation({ definition, context: baseContext })).toThrow(DuplicateNavIdError);
    });

    it('throws DuplicateNavIdError when a child shares an id with a top-level item', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home' },
                {
                    id: 'account',
                    label: 'Account',
                    children: [{ id: 'home', label: 'Duplicate' }],
                },
            ],
        };
        expect(() => defineNavigation({ definition, context: baseContext })).toThrow(DuplicateNavIdError);
    });

    it('throws DuplicateNavIdError when two children of the same parent share an id', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [
                        { id: 'settings', label: 'Settings' },
                        { id: 'settings', label: 'Settings Duplicate' },
                    ],
                },
            ],
        };
        expect(() => defineNavigation({ definition, context: baseContext })).toThrow(DuplicateNavIdError);
    });

    it('exposes the duplicate id on the error', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home' },
                { id: 'home', label: 'Duplicate' },
            ],
        };
        expect(() => defineNavigation({ definition, context: baseContext })).toThrow(
            expect.objectContaining({ id: 'home' })
        );
    });

    it('is catchable as the base NavError type', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home' },
                { id: 'home', label: 'Duplicate' },
            ],
        };
        try {
            defineNavigation({ definition, context: baseContext });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(NavError);
            expect((err as NavError).code).toBe('DUPLICATE_NAV_ID');
        }
    });

    it('validates the full tree before any resolver runs', () => {
        const resolverSpy = vi.fn(({ keep }: any) => keep());
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home', resolver: resolverSpy },
                { id: 'home', label: 'Duplicate' },
            ],
        };
        expect(() => defineNavigation({ definition, context: baseContext })).toThrow(DuplicateNavIdError);
        expect(resolverSpy).not.toHaveBeenCalled();
    });
});
