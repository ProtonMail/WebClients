import type { NavResolved } from '../types/nav';
import { applyPrefix } from './applyPrefix';

const nav: NavResolved = {
    items: [
        { id: 'home', label: 'Home', to: '/home', icon: undefined, meta: {}, children: undefined, sections: undefined },
        {
            id: 'account',
            label: 'Account',
            to: undefined,
            icon: undefined,
            meta: {},
            sections: undefined,
            children: [
                {
                    id: 'account.settings',
                    label: 'Settings',
                    to: '/account/settings',
                    icon: undefined,
                    meta: {},
                    children: undefined,
                    sections: undefined,
                },
            ],
        },
    ],
};

describe('applyPrefix', () => {
    it('prepends the prefix to every defined `to` at every depth', () => {
        const prefixed = applyPrefix(nav, '/app');
        expect(prefixed.items[0].to).toBe('/app/home');
        expect(prefixed.items[1].children?.[0].to).toBe('/app/account/settings');
    });

    it('leaves undefined `to` values alone', () => {
        const prefixed = applyPrefix(nav, '/app');
        expect(prefixed.items[1].to).toBeUndefined();
    });

    it('returns the input unchanged when the prefix is the empty string', () => {
        const prefixed = applyPrefix(nav, '');
        expect(prefixed).toBe(nav);
    });

    it('does not mutate the input tree', () => {
        const before = JSON.parse(JSON.stringify(nav));
        applyPrefix(nav, '/app');
        expect(nav).toEqual(before);
    });
});
