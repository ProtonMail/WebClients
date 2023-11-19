import { type VFC } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { vaultDeletionEffect } from 'proton-pass-extension/lib/components/Context/Items/ItemEffects';
import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { useSpotlightEffect } from 'proton-pass-extension/lib/hooks/useSpotlightEffect';

import { Header as HeaderComponent } from '@proton/components';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { SpotlightContent } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlightContext } from '@proton/pass/components/Spotlight/SpotlightContext';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { passwordSave } from '@proton/pass/store/actions/creators/pw-history';
import type { ItemType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import clsx from '@proton/utils/clsx';

import { MenuDropdown } from './MenuDropdown';

export const Header: VFC = () => {
    const { ready, context } = usePopupContext();
    const history = useHistory();
    const filtering = useItemsFilteringContext();
    const { search, shareId, sort, type, setSearch } = filtering;

    const dispatch = useDispatch();

    const onVaultDeleted = (shareId: string) => vaultDeletionEffect(shareId, filtering);
    const onVaultCreated = filtering.setShareId;

    const onNewItem = (type: ItemType) => {
        /* Trick to be able to return to the initial route using
         * history.goBack() if user switches from item creation
         * routes for multiple subsequent item types. */
        const shouldReplace = history.location.pathname.includes('/item/new/');
        history[shouldReplace ? 'replace' : 'push'](`/item/new/${type}`);
    };

    const onPasswordGenerated = (password: string) => {
        const { domain, subdomain, hostname } = context?.url ?? {};
        const url = subdomain ?? domain ?? hostname ?? null;

        dispatch(passwordSave({ createTime: getEpoch(), id: uniqueId(), origin: url, value: password }));
    };

    const spotlight = useSpotlightContext();
    const hideSpotlight = !spotlight.state.open || spotlight.state.pendingShareAccess || spotlight.state.upselling;
    useSpotlightEffect();

    return (
        <VaultActionsProvider onVaultCreated={onVaultCreated} onVaultDeleted={onVaultDeleted}>
            <HeaderComponent className="border-bottom h-auto p-2">
                <div className="flex flex-align-items-center gap-x-2 w-full">
                    <MenuDropdown />

                    <SearchBar
                        disabled={!ready}
                        filters={{ search, selectedShareId: shareId, sort, type }}
                        onChange={setSearch}
                    />

                    <ItemQuickActions onNewItem={onNewItem} onPasswordGenerated={onPasswordGenerated} />

                    <div className="flex-item-fluid-auto w-full">
                        <div className={clsx('pass-spotlight-panel', hideSpotlight && 'pass-spotlight-panel--hidden')}>
                            {spotlight.state.message && <SpotlightContent {...spotlight.state.message} />}
                        </div>
                    </div>
                </div>
            </HeaderComponent>
        </VaultActionsProvider>
    );
};
