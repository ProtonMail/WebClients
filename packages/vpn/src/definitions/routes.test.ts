import type { NavResolved } from '@proton/nav/types/nav';

import { findNavItem } from './routes';

const findNavItemById = vi.hoisted(() => vi.fn());

vi.mock('@proton/nav/api/findNavItem', () => ({
    findNavItemById,
}));

const nav = { items: [] } as NavResolved;

describe('findNavItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns undefined when nothing is found', () => {
        findNavItemById.mockReturnValue(undefined);
        expect(findNavItem(nav, 'my-vpn.download-apps')).toBeUndefined();
    });

    it('delegates to findNavItemById and returns the matched item', () => {
        const item = { id: 'my-vpn.download-apps', label: 'Downloads', sections: [] };
        findNavItemById.mockReturnValue(item);

        expect(findNavItem(nav, 'my-vpn.download-apps')).toBe(item);
        expect(findNavItemById).toHaveBeenCalledWith(nav, 'my-vpn.download-apps');
    });
});
