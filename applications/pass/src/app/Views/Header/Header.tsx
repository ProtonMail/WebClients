import { type FC, type ReactElement, useEffect } from 'react';

import { Header as CoreHeader } from '@proton/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Core/routing';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { SpotlightContent } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useOnboardingMessages } from '@proton/pass/hooks/useOnboardingMessages';
import { type ItemType, OnboardingMessage } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { onboarding } from '../../../lib/onboarding';

type Props = { hamburger?: ReactElement; searchable?: boolean; title?: string };

export const Header: FC<Props> = ({ hamburger, searchable = true }) => {
    const { filters, setFilters, navigate } = useNavigation();
    const onCreate = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    const spotlight = useSpotlight();
    const definitions = useOnboardingMessages();

    useEffect(() => {
        const messageType = onboarding.getMessage().message;
        if (messageType === OnboardingMessage.PENDING_SHARE_ACCESS) spotlight.setPendingShareAccess(true);
        else if (messageType) spotlight.setOnboardingMessage(definitions[messageType] ?? null);
    }, []);

    return (
        <CoreHeader className="border-bottom h-auto p-2">
            <div className="flex flex-align-items-center gap-x-2 w-full">
                {hamburger}
                {searchable && (
                    <>
                        <SearchBar filters={filters} onChange={(search) => setFilters({ search })} />
                        <ItemQuickActions onCreate={onCreate} />
                    </>
                )}
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
        </CoreHeader>
    );
};
