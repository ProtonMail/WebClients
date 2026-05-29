import { describe, expect, it } from 'vitest';

import type { NavContext } from '../types/models';
import type { NavDefinition } from '../types/nav';
import { SettingsLayoutVariant } from '../types/searchOptions';
import { defineSearchOptions } from './defineSearchOptions';

const makeContext = (): NavContext => ({ user: { id: 'u1', email: 'user@example.com' } }) as unknown as NavContext;

const baseContext = makeContext();

describe('defineSearchOptions — basic', () => {
    it('returns an empty array when there are no items', () => {
        const definition: NavDefinition = { items: [] };
        expect(defineSearchOptions({ definition, context: baseContext })).toEqual([]);
    });

    it('excludes items that have no `to`', () => {
        const definition: NavDefinition = { items: [{ id: 'group', label: 'Group' }] };
        expect(defineSearchOptions({ definition, context: baseContext })).toHaveLength(0);
    });

    it('creates one search option per item with a `to`', () => {
        const definition: NavDefinition = {
            items: [
                { id: 'home', label: 'Home', to: '/' },
                { id: 'settings', label: 'Settings', to: '/settings' },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results).toHaveLength(2);
        expect(results[0]).toMatchObject({ id: 'home', value: 'Home', to: '/' });
        expect(results[1]).toMatchObject({ id: 'settings', value: 'Settings', to: '/settings' });
    });

    it('sets beta to false and variant to Default for plain items', () => {
        const definition: NavDefinition = { items: [{ id: 'home', label: 'Home', to: '/' }] };
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.beta).toBe(false);
        expect(result.variant).toBe(SettingsLayoutVariant.Default);
    });

    it('sets `in` to an empty array for root-level items', () => {
        const definition: NavDefinition = { items: [{ id: 'home', label: 'Home', to: '/' }] };
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.in).toEqual([]);
    });
});

describe('defineSearchOptions — nested children', () => {
    it('includes children with `to` and builds breadcrumbs from their ancestors', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    children: [{ id: 'account.settings', label: 'Settings', to: '/account/settings' }],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ id: 'account.settings', to: '/account/settings', in: ['Account'] });
    });

    it('includes a parent with `to` and separately includes its children', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    to: '/account',
                    children: [{ id: 'account.settings', label: 'Settings', to: '/account/settings' }],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results).toHaveLength(2);
        expect(results[0]).toMatchObject({ id: 'account', in: [] });
        expect(results[1]).toMatchObject({ id: 'account.settings', in: ['Account'] });
    });

    it('accumulates breadcrumbs across multiple levels of nesting', () => {
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
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.in).toEqual(['Level 1', 'Level 2']);
    });
});

describe('defineSearchOptions — sections', () => {
    it('pushes one extra search option per section of an item with `to`', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    sections: [
                        { id: 'security', text: 'Security', to: 'security' },
                        { id: 'privacy', text: 'Privacy', to: 'privacy' },
                    ],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results).toHaveLength(3);
    });

    it("appends the section's `to` suffix onto the parent item's `to`", () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    sections: [{ id: 'security', text: 'Security', to: 'security' }],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results[1]).toMatchObject({ id: 'security', to: '/settings#security' });
    });

    it('sets the section breadcrumb to include the parent item label', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    sections: [{ id: 'security', text: 'Security', to: 'security' }],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results[1].in).toEqual(['Settings']);
    });

    it('uses section text as value, falling back to the parent label when absent', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    sections: [
                        { id: 'with-text', text: 'Security', to: 'with-text' },
                        { id: 'no-text', to: 'no-text' },
                    ],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results[1].value).toBe('Security');
        expect(results[2]).toBeUndefined();
    });

    it('carries beta and variant from the section onto the search option', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    sections: [
                        { id: 'labs', to: 'labs', text: 'Labs', beta: true, variant: SettingsLayoutVariant.Card },
                    ],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results[1]).toMatchObject({ beta: true, variant: SettingsLayoutVariant.Card });
    });
});

describe('defineSearchOptions — icon inheritance', () => {
    it('carries the item icon onto its search option', () => {
        const definition: NavDefinition = {
            items: [{ id: 'home', label: 'Home', to: '/', icon: 'house' }],
        };
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.icon).toBe('house');
    });

    it('inherits the nearest ancestor icon when the item has none', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'account',
                    label: 'Account',
                    icon: 'user',
                    children: [{ id: 'account.settings', label: 'Settings', to: '/settings' }],
                },
            ],
        };
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.icon).toBe('user');
    });

    it('sets icon to undefined when neither the item nor any ancestor has one', () => {
        const definition: NavDefinition = { items: [{ id: 'home', label: 'Home', to: '/' }] };
        const [result] = defineSearchOptions({ definition, context: baseContext });
        expect(result.icon).toBeUndefined();
    });

    it('carries the item icon onto its section search options', () => {
        const definition: NavDefinition = {
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    to: '/settings',
                    icon: 'archive-box',
                    sections: [{ id: 'security', text: 'Security', to: 'security' }],
                },
            ],
        };
        const results = defineSearchOptions({ definition, context: baseContext });
        expect(results[1].icon).toBe('archive-box');
    });
});
