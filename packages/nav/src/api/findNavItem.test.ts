import type { NavContext } from '../types/models';
import type { NavDefinition, NavItemDefinition } from '../types/nav';
import type { NavDefinitionIds } from '../types/navIds';
import { defineNavigation } from './defineNavigation';
import { findNavItemById } from './findNavItem';

const baseContext = { user: { id: 'u1', email: 'u@example.com' } } as unknown as NavContext;

const resolve = (items: NavItemDefinition[]) => defineNavigation({ definition: { items }, context: baseContext });

describe('findNavItemById', () => {
    it('returns undefined when nothing matches', () => {
        const nav = resolve([{ id: 'home', label: 'Home', to: '/' }]);
        expect(findNavItemById(nav, 'missing')).toBeUndefined();
    });

    it('finds a top-level item', () => {
        const nav = resolve([{ id: 'home', label: 'Home', to: '/' }]);
        expect(findNavItemById(nav, 'home')?.id).toBe('home');
    });

    it('finds a deeply nested item by id', () => {
        const nav = resolve([
            {
                id: 'account',
                label: 'Account',
                children: [
                    {
                        id: 'account.security',
                        label: 'Security',
                        children: [{ id: 'account.security.sessions', label: 'Sessions', to: '/sessions' }],
                    },
                ],
            },
        ]);
        expect(findNavItemById(nav, 'account.security.sessions')?.to).toBe('/sessions');
    });

    it('returns undefined for an id that was pruned during resolution', () => {
        const nav = resolve([
            { id: 'visible', label: 'Visible', to: '/v' },
            { id: 'gone', label: 'Gone', to: '/g', isVisible: () => false },
        ]);
        expect(findNavItemById(nav, 'gone')).toBeUndefined();
    });
});

describe('NavDefinitionIds (type-level)', () => {
    it('extracts the id union from an as-const definition', () => {
        const def = {
            items: [
                { id: 'a', label: 'A', to: '/a' },
                { id: 'b', label: 'B', children: [{ id: 'b.c', label: 'C', to: '/c' }] },
            ],
        } as const satisfies NavDefinition;

        type Id = NavDefinitionIds<typeof def>;

        // Compile-time assertions: every literal id is assignable
        const ids: Id[] = ['a', 'b', 'b.c'];
        // @ts-expect-error — 'nope' is not a known id
        const bad: Id = 'nope';

        expect(def.items).toHaveLength(2);
        expect(ids).toHaveLength(3);
        expect(bad).toBe('nope');
    });
});
