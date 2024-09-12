import { type FC } from 'react';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { useOnboardingListener } from 'proton-pass-extension/lib/hooks/useOnboardingListener';

import { Header as CoreHeader } from '@proton/components';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import type { ItemType } from '@proton/pass/types';

import { MenuDropdown } from './MenuDropdown';

export const Header: FC = () => {
    const { ready, initial } = usePopupContext();
    const { url } = useExtensionContext();
    const { domain, subdomain, hostname } = url ?? {};

    const { navigate } = useNavigation();
    const onCreate = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    useOnboardingListener();

    return (
        <VaultActionsProvider>
            <CoreHeader className="border-bottom h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <MenuDropdown />
                    <SearchBar disabled={!ready} initial={initial.search} />
                    <ItemQuickActions onCreate={onCreate} origin={subdomain ?? domain ?? hostname ?? null} />
                    <Spotlight />
                </div>
            </CoreHeader>
            <PinnedItemsBar />
        </VaultActionsProvider>
    );
};
