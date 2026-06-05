import type { NavContext } from '../types/models';
import type { NavDefinition, NavItemDefinition } from '../types/nav';
import { defineSearchOptions } from './defineSearchOptions';
import { defineSidebar } from './defineSidebar';

const makeContext = (extras: Record<string, unknown> = {}): NavContext =>
    ({ user: { id: 'u1', email: 'user@example.com' }, ...extras }) as unknown as NavContext;

const baseContext = makeContext();

const sidebar = <TContext extends NavContext = NavContext>(
    items: NavItemDefinition<TContext>[],
    context: TContext = baseContext as TContext
) => defineSidebar<TContext>({ definition: { items }, context }).items;

describe('defineSidebar', () => {
    it('returns an empty array when there are no items', () => {
        const definition: NavDefinition = { items: [] };
        expect(defineSidebar({ definition, context: baseContext }).items).toEqual([]);
    });

    it('keeps items that are not hidden', () => {
        const items = sidebar([
            { id: 'home', label: 'Home', to: '/' },
            { id: 'settings', label: 'Settings', to: '/settings' },
        ]);
        expect(items.map((i) => i.id)).toEqual(['home', 'settings']);
    });

    it('accepts an already-resolved tree as well as a definition', () => {
        const resolved = { items: [{ id: 'home', label: 'Home', to: '/', hideFromSidebar: false }] } as any;
        expect(defineSidebar(resolved).items.map((i: { id: string }) => i.id)).toEqual(['home']);
    });

    describe('hidden leaves', () => {
        it('drops a leaf flagged hideFromSidebar', () => {
            const items = sidebar([
                { id: 'home', label: 'Home', to: '/' },
                { id: 'sub', label: 'Subroute', to: '/sub', hideFromSidebar: true },
            ]);
            expect(items.map((i) => i.id)).toEqual(['home']);
        });

        it('resolves a computed hideFromSidebar before deciding', () => {
            type Ctx = NavContext & { beta: boolean };
            const items = sidebar<Ctx>(
                [{ id: 'sub', label: 'Subroute', to: '/sub', hideFromSidebar: ({ context }) => !context.beta }],
                makeContext({ beta: false }) as Ctx
            );
            expect(items).toHaveLength(0);
        });
    });

    describe('hidden containers', () => {
        it('drops a hidden node together with its entire subtree', () => {
            const items = sidebar([
                {
                    id: 'parent',
                    label: 'Parent',
                    to: '/parent',
                    hideFromSidebar: true,
                    children: [{ id: 'child', label: 'Child', to: '/parent/child' }],
                },
            ]);
            expect(items).toHaveLength(0);
        });

        it('removes only the hidden child, keeping its visible siblings', () => {
            const [parent] = sidebar([
                {
                    id: 'parent',
                    label: 'Parent',
                    to: '/parent',
                    children: [
                        { id: 'visible', label: 'Visible', to: '/parent/visible' },
                        { id: 'hidden', label: 'Hidden', to: '/parent/hidden', hideFromSidebar: true },
                    ],
                },
            ]);
            expect(parent.children?.map((c) => c.id)).toEqual(['visible']);
        });

        it('prunes a container left empty after all its children are hidden', () => {
            const items = sidebar([
                {
                    id: 'group',
                    label: 'Group',
                    children: [{ id: 'only', label: 'Only', to: '/only', hideFromSidebar: true }],
                },
            ]);
            expect(items).toHaveLength(0);
        });

        it('keeps a navigable container even when all its children are hidden', () => {
            const [item] = sidebar([
                {
                    id: 'group',
                    label: 'Group',
                    to: '/group',
                    children: [{ id: 'only', label: 'Only', to: '/group/only', hideFromSidebar: true }],
                },
            ]);
            expect(item.id).toBe('group');
            expect(item.children).toBeUndefined();
        });
    });

    it('leaves hidden items searchable — defineSearchOptions still surfaces them', () => {
        const definition: NavDefinition = {
            items: [{ id: 'sub', label: 'Subroute', to: '/sub', hideFromSidebar: true }],
        };
        expect(defineSidebar({ definition, context: baseContext }).items).toHaveLength(0);
        expect(defineSearchOptions({ definition, context: baseContext }).map((o) => o.id)).toEqual(['sub']);
    });
});
