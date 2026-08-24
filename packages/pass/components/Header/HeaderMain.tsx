import { memo } from 'react';

import CoreHeader from '@proton/components/components/header/Header';

import { PinnedItemsBar } from '../Item/Pinned/PinnedItemsBar';
import { SearchBar } from '../Item/Search/SearchBar';
import { MenuDropdown } from '../Menu/Dropdown/MenuDropdown';
import { ItemQuickActions } from '../Menu/Item/ItemQuickActions';
import { UpsellButton } from '../Menu/Upsell/UpsellButton';
import { Spotlight } from '../Spotlight/Spotlight';
import { HeaderVaultSelector } from './HeaderVaultSelector';
import type { HeaderProps } from './types';

export const HeaderMain = memo(({ onLock, onLogout, interactive, origin }: HeaderProps) => {
    return (
        <>
            <CoreHeader className="border-bottom border-weak h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <MenuDropdown onLock={onLock} onLogout={onLogout} interactive={interactive} />
                    <HeaderVaultSelector />
                    <SearchBar disabled={!interactive} />
                    <UpsellButton />
                    <ItemQuickActions origin={origin} />
                    {interactive && <Spotlight />}
                </div>
            </CoreHeader>

            {interactive && <PinnedItemsBar />}
        </>
    );
});

HeaderMain.displayName = 'ItemsHeaderMemo';
