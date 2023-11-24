import { type VFC } from 'react';
import { useHistory } from 'react-router-dom';

import { vaultDeletionEffect } from 'proton-pass-extension/lib/components/Context/Items/ItemEffects';
import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useOnboardingListener } from 'proton-pass-extension/lib/hooks/useOnboardingListener';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import { Header as HeaderComponent } from '@proton/components';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { SpotlightContent } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import type { ItemType } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { MenuDropdown } from './MenuDropdown';

export const Header: VFC = () => {
    const { ready, context } = usePopupContext();
    const { domain, subdomain, hostname } = context?.url ?? {};
    const history = useHistory();

    const filtering = useItemsFilteringContext();
    const { search, shareId, sort, type, setSearch } = filtering;

    const onVaultDeleted = (shareId: string) => vaultDeletionEffect(shareId, filtering);
    const onVaultCreated = filtering.setShareId;

    const onCreate = (type: ItemType) => {
        /* Trick to be able to return to the initial route using
         * history.goBack() if user switches from item creation
         * routes for multiple subsequent item types. */
        const shouldReplace = history.location.pathname.includes('/item/new/');
        history[shouldReplace ? 'replace' : 'push'](`/item/new/${type}`);
    };

    const spotlight = useSpotlight();
    useOnboardingListener();

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

                    <ItemQuickActions onCreate={onCreate} origin={subdomain ?? domain ?? hostname ?? null} />

                    <div className="flex-item-fluid-auto w-full">
                        <div
                            className={clsx(
                                'pass-spotlight-panel',
                                !spotlight.state.open && 'pass-spotlight-panel--hidden'
                            )}
                        >
                            {spotlight.state.message && <SpotlightContent {...spotlight.state.message} />}
                        </div>
                    </div>
                </div>
            </HeaderComponent>
        </VaultActionsProvider>
    );
};
