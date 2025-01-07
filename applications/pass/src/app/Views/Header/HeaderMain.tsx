import { memo, useEffect } from 'react';

import type { HeaderProps } from 'proton-pass-web/app/Views/Header/types';
import { spotlight as spotlightService } from 'proton-pass-web/lib/spotlight';

import { Header as CoreHeader, Hamburger } from '@proton/components';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { SpotlightMessage } from '@proton/pass/types';

const SpotlightSection = () => {
    const spotlight = useSpotlight();
    const definitions = useSpotlightMessages();

    useEffect(() => {
        const type = spotlightService.getMessage().message;

        switch (type) {
            case null:
                break;
            case SpotlightMessage.PENDING_SHARE_ACCESS:
                spotlight.setPendingShareAccess(true);
                break;
            default:
                const definition = definitions[type];
                if (definition) spotlight.setSpotlight(definition);
                break;
        }
    }, []);

    return <Spotlight />;
};

export const HeaderMain = memo(({ sidebarExpanded, sidebarToggle }: HeaderProps) => {
    const interactive = useItemScope() !== undefined;

    return (
        <>
            <CoreHeader className="border-bottom border-weak h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <Hamburger expanded={sidebarExpanded} onToggle={sidebarToggle} />
                    <SearchBar disabled={!interactive} />
                    <ItemQuickActions />
                    {interactive && <SpotlightSection />}
                </div>
            </CoreHeader>

            {interactive && <PinnedItemsBar />}
        </>
    );
});

HeaderMain.displayName = 'ItemsHeaderMemo';
