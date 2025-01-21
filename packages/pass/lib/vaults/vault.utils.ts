import type { VaultShareItem } from '@proton/pass/store/reducers';

export const sortVaults = (a: VaultShareItem, b: VaultShareItem) => a.content.name.localeCompare(b.content.name);
