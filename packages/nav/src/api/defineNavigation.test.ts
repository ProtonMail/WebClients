import { DuplicateNavIdError } from '../errors';
import type { NavContext } from '../types/models';
import type { NavDefinition, NavItemDefinition } from '../types/nav';
import type { TestUserModel } from '../types/test.models';
import { defineNavigation } from './defineNavigation';

const makeContext = (extras: Record<string, unknown> = {}): NavContext =>
    ({ user: { id: 'u1', email: 'u@example.com' } satisfies TestUserModel, ...extras }) as unknown as NavContext;

const baseContext = makeContext();

const resolve = <TContext extends NavContext = NavContext>(
    items: NavItemDefinition<TContext>[],
    context: TContext = baseContext as TContext
) => defineNavigation<TContext>({ definition: { items }, context }).items;

describe('defineNavigation', () => {
    describe('resolved item shape', () => {
        it('mirrors every static field from the definition onto the resolved item', () => {
            const [item] = resolve([{ id: 'home', label: 'Home', to: '/', icon: 'house', meta: { badge: 'new' } }]);
            expect(item).toEqual({
                id: 'home',
                label: 'Home',
                to: '/',
                icon: 'house',
                meta: { badge: 'new' },
                children: undefined,
                hideFromSidebar: false,
            });
        });

        it('defaults meta to an empty object when the definition omits it', () => {
            const [item] = resolve([{ id: 'home', label: 'Home', to: '/' }]);
            expect(item.meta).toEqual({});
        });

        it('preserves the order in which items were declared', () => {
            const items = resolve([
                { id: 'first', label: 'First', to: '/1' },
                { id: 'second', label: 'Second', to: '/2' },
                { id: 'third', label: 'Third', to: '/3' },
            ]);
            expect(items.map((i) => i.id)).toEqual(['first', 'second', 'third']);
        });
    });

    describe('computed fields', () => {
        it.each`
            field      | resolved
            ${'label'} | ${'Computed Label'}
            ${'to'}    | ${'/computed-to'}
            ${'icon'}  | ${'compass'}
        `('runs $field as a function and uses its return value', ({ field, resolved }) => {
            const [item] = resolve([
                {
                    id: 'leaf',
                    label: 'Static',
                    to: '/leaf',
                    [field]: () => resolved,
                } as NavItemDefinition,
            ]);
            expect(item).toMatchObject({ [field]: resolved });
        });

        it('runs meta as a function and uses its return value', () => {
            type Ctx = NavContext & { notifications: number };
            const [item] = resolve<Ctx>(
                [
                    {
                        id: 'inbox',
                        label: 'Inbox',
                        to: '/inbox',
                        meta: ({ context }) => ({ count: context.notifications }),
                    },
                ],
                makeContext({ notifications: 7 }) as Ctx
            );
            expect(item.meta).toEqual({ count: 7 });
        });

        it('passes the same runtime context to every computed field', () => {
            type Ctx = NavContext & { plan: 'free' | 'pro' };
            const [item] = resolve<Ctx>(
                [
                    {
                        id: 'home',
                        label: ({ context }) => `Home (${context.plan})`,
                        to: ({ context }) => `/${context.plan}`,
                        meta: ({ context }) => ({ plan: context.plan }),
                    },
                ],
                makeContext({ plan: 'pro' }) as Ctx
            );
            expect(item).toMatchObject({
                label: 'Home (pro)',
                to: '/pro',
                meta: { plan: 'pro' },
            });
        });
    });

    describe('hideFromSidebar', () => {
        it('defaults to false when the definition omits it', () => {
            const [item] = resolve([{ id: 'home', label: 'Home', to: '/' }]);
            expect(item.hideFromSidebar).toBe(false);
        });

        it('mirrors a static boolean onto the resolved item', () => {
            const [item] = resolve([{ id: 'sub', label: 'Subroute', to: '/sub', hideFromSidebar: true }]);
            expect(item.hideFromSidebar).toBe(true);
        });

        it('runs hideFromSidebar as a function and uses its return value', () => {
            type Ctx = NavContext & { betaUser: boolean };
            const [item] = resolve<Ctx>(
                [
                    {
                        id: 'sub',
                        label: 'Subroute',
                        to: '/sub',
                        hideFromSidebar: ({ context }) => !context.betaUser,
                    },
                ],
                makeContext({ betaUser: false }) as Ctx
            );
            expect(item.hideFromSidebar).toBe(true);
        });

        it('does not prune hidden items — they stay reachable in the resolved tree', () => {
            const items = resolve([{ id: 'sub', label: 'Subroute', to: '/sub', hideFromSidebar: true }]);
            expect(items.map((i) => i.id)).toEqual(['sub']);
        });
    });

    describe('nesting', () => {
        it('attaches resolved children to their parent in declaration order', () => {
            const [parent] = resolve([
                {
                    id: 'account',
                    label: 'Account',
                    children: [
                        { id: 'account.settings', label: 'Settings', to: '/account/settings' },
                        { id: 'account.security', label: 'Security', to: '/account/security' },
                    ],
                },
            ]);
            expect(parent.children?.map((c) => c.id)).toEqual(['account.settings', 'account.security']);
        });

        it('leaves children undefined when the definition has none', () => {
            const [item] = resolve([{ id: 'home', label: 'Home', to: '/' }]);
            expect(item.children).toBeUndefined();
        });

        it('walks arbitrary depth, resolving children of children of children', () => {
            const [l1] = resolve([
                {
                    id: 'l1',
                    label: 'L1',
                    children: [
                        {
                            id: 'l2',
                            label: 'L2',
                            children: [{ id: 'l3', label: 'L3', to: '/deep' }],
                        },
                    ],
                },
            ]);
            expect(l1.children?.[0].children?.[0].id).toBe('l3');
        });
    });

    describe('isVisible gating', () => {
        it('keeps the item when isVisible is omitted (default visible)', () => {
            const items = resolve([{ id: 'home', label: 'Home', to: '/' }]);
            expect(items).toHaveLength(1);
        });

        it('keeps the item when isVisible returns true', () => {
            const items = resolve([{ id: 'home', label: 'Home', to: '/', isVisible: () => true }]);
            expect(items).toHaveLength(1);
        });

        it('prunes the item and its entire subtree when isVisible returns false', () => {
            const items = resolve([
                {
                    id: 'admin',
                    label: 'Admin',
                    to: '/admin',
                    isVisible: () => false,
                    children: [{ id: 'admin.audit', label: 'Audit', to: '/admin/audit' }],
                },
            ]);
            expect(items).toHaveLength(0);
        });

        it('short-circuits — children are not resolved when isVisible returns false', () => {
            const childLabel = vi.fn(() => 'Audit');
            resolve([
                {
                    id: 'admin',
                    label: 'Admin',
                    to: '/admin',
                    isVisible: () => false,
                    children: [{ id: 'admin.audit', label: childLabel, to: '/admin/audit' }],
                },
            ]);
            expect(childLabel).not.toHaveBeenCalled();
        });

        it('passes the runtime context to the predicate', () => {
            type Ctx = NavContext & { plan: 'free' | 'pro' };
            const def: NavItemDefinition<Ctx>[] = [
                { id: 'billing', label: 'Billing', to: '/billing', isVisible: ({ context }) => context.plan === 'pro' },
            ];
            expect(resolve<Ctx>(def, makeContext({ plan: 'pro' }) as Ctx)).toHaveLength(1);
            expect(resolve<Ctx>(def, makeContext({ plan: 'free' }) as Ctx)).toHaveLength(0);
        });
    });

    describe('pruning rules', () => {
        it.each`
            scenario                                          | item
            ${'a leaf with no `to` and no children'}          | ${{ id: 'group', label: 'Group' }}
            ${'a leaf whose computed `to` returns undefined'} | ${{ id: 'home', label: 'Home', to: () => undefined }}
            ${'an item gated off by isVisible'}               | ${{ id: 'home', label: 'Home', to: '/', isVisible: () => false }}
        `('prunes $scenario', ({ item }) => {
            expect(resolve([item])).toHaveLength(0);
        });

        it('cascades — a container whose subtree is entirely pruned is pruned itself', () => {
            const items = resolve([
                {
                    id: 'a',
                    label: 'A',
                    children: [{ id: 'a.b', label: 'B', children: [{ id: 'a.b.c', label: 'C' }] }],
                },
            ]);
            expect(items).toHaveLength(0);
        });

        it('keeps a container as long as one descendant survives', () => {
            const items = resolve([
                {
                    id: 'group',
                    label: 'Group',
                    children: [
                        { id: 'group.pruned', label: 'Pruned' },
                        { id: 'group.kept', label: 'Kept', to: '/kept' },
                    ],
                },
            ]);
            expect(items).toHaveLength(1);
            expect(items[0].children?.map((c) => c.id)).toEqual(['group.kept']);
        });

        it('still prunes a container that passes isVisible if no child survives', () => {
            const items = resolve([
                {
                    id: 'group',
                    label: 'Group',
                    isVisible: () => true,
                    children: [{ id: 'group.dead', label: 'Dead' }],
                },
            ]);
            expect(items).toHaveLength(0);
        });
    });

    describe('id validation is wired into the pipeline', () => {
        it('runs id validation before any computed field or predicate executes', () => {
            const labelSpy = vi.fn(() => 'Home');
            const visibilitySpy = vi.fn(() => true);
            const definition: NavDefinition = {
                items: [
                    { id: 'home', label: labelSpy, to: '/', isVisible: visibilitySpy },
                    { id: 'home', label: 'Dup', to: '/d' },
                ],
            };
            expect(() => defineNavigation({ definition, context: baseContext })).toThrow(DuplicateNavIdError);
            expect(labelSpy).not.toHaveBeenCalled();
            expect(visibilitySpy).not.toHaveBeenCalled();
        });
    });
});
