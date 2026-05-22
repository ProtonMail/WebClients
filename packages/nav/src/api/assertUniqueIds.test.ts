import { describe, expect, it } from 'vitest';

import { DuplicateNavIdError, NavError } from '../errors';
import type { NavItemDefinition } from '../types/nav';
import { assertUniqueIds } from './assertUniqueIds';

describe('assertUniqueIds', () => {
    it('does nothing when every id in the tree is unique', () => {
        const items: NavItemDefinition[] = [
            { id: 'home', label: 'Home', to: '/' },
            {
                id: 'account',
                label: 'Account',
                children: [{ id: 'account.settings', label: 'Settings', to: '/account/settings' }],
            },
        ];
        expect(() => assertUniqueIds(items)).not.toThrow();
    });

    it.each`
        scenario                                             | items
        ${'two top-level items share an id'}                 | ${[{ id: 'home', label: 'Home', to: '/' }, { id: 'home', label: 'Duplicated', to: '/d' }]}
        ${'a child shares an id with a top-level item'}      | ${[{ id: 'home', label: 'Home', to: '/' }, { id: 'account', label: 'Account', children: [{ id: 'home', label: 'Duplicated', to: '/d' }] }]}
        ${'two children of the same parent share an id'}     | ${[{ id: 'account', label: 'Account', children: [{ id: 'settings', label: 'A', to: '/a' }, { id: 'settings', label: 'B', to: '/b' }] }]}
        ${'a deeply nested child duplicates a top-level id'} | ${[{ id: 'home', label: 'Home', to: '/' }, { id: 'a', label: 'A', children: [{ id: 'b', label: 'B', children: [{ id: 'home', label: 'Deep duplicated', to: '/d' }] }] }]}
    `('throws DuplicateNavIdError when $scenario', ({ items }) => {
        expect(() => assertUniqueIds(items)).toThrow(DuplicateNavIdError);
    });

    it('exposes the duplicate id on the error and remains a NavError', () => {
        try {
            assertUniqueIds([
                { id: 'home', label: 'Home', to: '/' },
                { id: 'home', label: 'Duplicated', to: '/d' },
            ]);
            expect.fail('expected duplicate-id error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(NavError);
            expect((err as NavError).code).toBe('DUPLICATE_NAV_ID');
            expect((err as DuplicateNavIdError).ids).toEqual(['home']);
        }
    });

    it('aggregates every duplicate id rather than failing on the first one', () => {
        try {
            assertUniqueIds([
                { id: 'home', label: 'Home', to: '/' },
                { id: 'home', label: 'Duplicated home', to: '/d' },
                { id: 'about', label: 'About', to: '/a' },
                { id: 'about', label: 'Duplicated about', to: '/b' },
            ]);
            expect.fail('expected duplicate-id error to be thrown');
        } catch (err) {
            expect((err as DuplicateNavIdError).ids).toEqual(['home', 'about']);
        }
    });

    it('lists each duplicated id once even if it appears three or more times', () => {
        try {
            assertUniqueIds([
                { id: 'home', label: 'A', to: '/a' },
                { id: 'home', label: 'B', to: '/b' },
                { id: 'home', label: 'C', to: '/c' },
            ]);
            expect.fail('expected duplicate-id error to be thrown');
        } catch (err) {
            expect((err as DuplicateNavIdError).ids).toEqual(['home']);
        }
    });

    it('does not throw on an empty items array', () => {
        expect(() => assertUniqueIds([])).not.toThrow();
    });
});
