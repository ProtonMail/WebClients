import { memo, useEffect } from 'react';

import type { HeaderProps } from 'proton-pass-web/app/Views/Header/types';
import { spotlight as spotlightService } from 'proton-pass-web/lib/spotlight';

import { Header as CoreHeader, Hamburger } from '@proton/components';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import type { ItemType } from '@proton/pass/types';
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
    const { matchOnboarding } = useNavigationMatches();
    const navigate = useNavigate();
    const onCreate = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    return (
        <>
            <CoreHeader className="border-bottom border-weak h-auto p-2">
                <div className="flex items-center gap-x-2 w-full">
                    <Hamburger expanded={sidebarExpanded} onToggle={sidebarToggle} />
                    <SearchBar disabled={matchOnboarding} />
                    <ItemQuickActions onCreate={onCreate} />
                    {!matchOnboarding && <SpotlightSection />}
                </div>
            </CoreHeader>

            {!matchOnboarding && <PinnedItemsBar />}
        </>
    );
});

HeaderMain.displayName = 'ItemsHeaderMemo';
