import type { PassBridge, PassBridgeAliasItem } from '@proton/pass/lib/bridge/types';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';

export const filterPassAliases = (aliases: PassBridgeAliasItem[]) => {
    const filterNonTrashedItems = ({ item }: PassBridgeAliasItem) => !isTrashed(item);
    const sortDesc = (a: PassBridgeAliasItem, b: PassBridgeAliasItem) => {
        const aTime = a.item.lastUseTime ?? a.item.revisionTime;
        const bTime = b.item.lastUseTime ?? b.item.revisionTime;

        return bTime - aTime;
    };

    return aliases.filter(filterNonTrashedItems).sort(sortDesc);
};

export const fetchPassBridgeInfos = async (PassBridge: PassBridge) => {
    let userHadVault = false;

    const defaultVault = await PassBridge.vault.getDefault(
        (hadVault) => {
            userHadVault = hadVault;
        },
        { maxAge: UNIX_DAY * 1 }
    );

    const aliases = await PassBridge.alias.getAllByShareId(defaultVault.shareId);
    return { aliases, vault: defaultVault, userHadVault };
};
