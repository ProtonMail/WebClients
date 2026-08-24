import type { VaultShareItem } from '../../store/reducers';
import { isShareVisible } from '../shares/share.predicates';

/** Sort vaults with visible ones first, then alphabetically by name */
export const sortVaults = (a: VaultShareItem, b: VaultShareItem) => {
    const aVisible = isShareVisible(a);
    const bVisible = isShareVisible(b);

    if (aVisible !== bVisible) return aVisible ? -1 : 1;
    return a.content.name.localeCompare(b.content.name);
};
