import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import type { VaultShareItem } from '@proton/pass/store/reducers';

/** Sort vaults with visible ones first, then alphabetically by name */
export const sortVaults = (a: VaultShareItem, b: VaultShareItem) => {
    const aVisible = isShareVisible(a);
    const bVisible = isShareVisible(b);

    if (aVisible !== bVisible) return aVisible ? -1 : 1;
    return a.content.name.localeCompare(b.content.name);
};
