import type { PassBridge } from '@proton/pass/lib/bridge/types';
import type { PassBridgeAliasItem } from '@proton/pass/lib/bridge/types';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

import { PassAliasesVault } from './interface';

export const filterPassAliases = (aliases: PassBridgeAliasItem[]) => {
    const filterNonTrashedItems = ({ item }: PassBridgeAliasItem) => !isTrashed(item);
    const sortDesc = (a: PassBridgeAliasItem, b: PassBridgeAliasItem) => {
        const aTime = a.item.lastUseTime ?? a.item.revisionTime;
        const bTime = b.item.lastUseTime ?? b.item.revisionTime;

        return bTime - aTime;
    };

    return aliases.filter(filterNonTrashedItems).sort(sortDesc);
};

export const fetchPassAliases = async (PassBridge: PassBridge, defaultVault: PassAliasesVault) => {
    const aliases = await PassBridge.alias.getAllByShareId(defaultVault.shareId, {
        maxAge: UNIX_MINUTE * 5,
    });
    const userAccess = await PassBridge.user.getUserAccess({ maxAge: UNIX_MINUTE * 5 });
    const filteredAliases = filterPassAliases(aliases);

    return {
        aliasesCountLimit: userAccess.plan.AliasLimit ?? Number.MAX_SAFE_INTEGER,
        filteredAliases,
        aliases,
    };
};
