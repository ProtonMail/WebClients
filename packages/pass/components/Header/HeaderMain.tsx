import { memo } from 'react';

import CoreHeader from '@proton/components/components/header/Header';
import type { HeaderProps } from '@proton/pass/components/Header/types';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { MenuDropdown } from '@proton/pass/components/Menu/Dropdown/MenuDropdown';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { UpsellButton } from '@proton/pass/components/Menu/Upsell/UpsellButton';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';

export const HeaderMain = memo(({ onLock, onLogout, interactive, origin }: HeaderProps) => {
    return (
        <>
            <CoreHeader className="border-bottom border-weak h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <MenuDropdown onLock={onLock} onLogout={onLogout} interactive={interactive} />
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
