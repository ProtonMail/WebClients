import { type FC } from 'react';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { useSpotlightListener } from 'proton-pass-extension/lib/hooks/useSpotlightListener';

import { Header as CoreHeader } from '@proton/components';
import { AuthDeviceTopBanner } from '@proton/pass/components/Auth/AuthDeviceTopBanner';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import type { ItemType } from '@proton/pass/types';
import { resolveDomain } from '@proton/pass/utils/url/utils';

import { MenuDropdown } from './MenuDropdown';

export const Header: FC = () => {
    const { ready, initial } = usePopupContext();
    const { url } = useExtensionContext();

    const { navigate } = useNavigation();
    const onCreate = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    useSpotlightListener();

    return (
        <VaultActionsProvider>
            <AuthDeviceTopBanner />
            <CoreHeader className="border-bottom border-weak h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <MenuDropdown />
                    <SearchBar disabled={!ready} initial={initial.search} />
                    <ItemQuickActions onCreate={onCreate} origin={url ? resolveDomain(url) : null} />
                    <Spotlight />
                </div>
            </CoreHeader>
            <PinnedItemsBar />
        </VaultActionsProvider>
    );
};
