import { type VFC } from 'react';

import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { useSpotlightEffect } from 'proton-pass-extension/lib/hooks/useSpotlightEffect';

import { Header as HeaderComponent } from '@proton/components';
import { SpotlightContent } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlightContext } from '@proton/pass/components/Spotlight/SpotlightContext';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import clsx from '@proton/utils/clsx';

import { MenuDropdown } from './MenuDropdown';
import { QuickActionsDropdown } from './QuickActionsDropdown';
import { Searchbar } from './Searchbar';

export const Header: VFC = () => {
    const { ready, context } = usePopupContext();
    const { search, setSearch } = useItemsFilteringContext();
    const spotlight = useSpotlightContext();

    const hideSpotlight = !spotlight.state.open || spotlight.state.pendingShareAccess || spotlight.state.upselling;

    useSpotlightEffect();

    return (
        <>
            <HeaderComponent className="border-bottom h-auto p-2">
                <div className="flex flex-align-items-center gap-x-2 w-full">
                    <VaultActionsProvider>
                        <MenuDropdown />
                    </VaultActionsProvider>
                    <Searchbar disabled={!ready} value={search} handleValue={setSearch} />
                    <QuickActionsDropdown parsedUrl={context?.url} />

                    <div className="flex-item-fluid-auto w-full">
                        <div className={clsx('pass-spotlight-panel', hideSpotlight && 'pass-spotlight-panel--hidden')}>
                            {spotlight.state.message && <SpotlightContent {...spotlight.state.message} />}
                        </div>
                    </div>
                </div>
            </HeaderComponent>
        </>
    );
};
