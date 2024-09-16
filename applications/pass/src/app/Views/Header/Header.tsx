import { type FC, type ReactElement, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Header as CoreHeader, Icon } from '@proton/components';
import { PinnedItemsBar } from '@proton/pass/components/Item/Pinned/PinnedItemsBar';
import { SearchBar } from '@proton/pass/components/Item/Search/SearchBar';
import { ItemQuickActions } from '@proton/pass/components/Menu/Item/ItemQuickActions';
import { MonitorHeader } from '@proton/pass/components/Monitor/MonitorHeader';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useOnboardingMessages } from '@proton/pass/hooks/useOnboardingMessages';
import { type ItemType, OnboardingMessage } from '@proton/pass/types';

import { onboarding } from '../../../lib/onboarding';

type Props = { hamburger?: ReactElement; searchable?: boolean; title?: string };

export const Header: FC<Props> = ({ hamburger }) => {
    const { filters, navigate, matchOnboarding } = useNavigation();
    const onCreate = (type: ItemType) => navigate(getLocalPath(`item/new/${type}`));

    const spotlight = useSpotlight();
    const definitions = useOnboardingMessages();

    useEffect(() => {
        const messageType = onboarding.getMessage().message;
        if (messageType === OnboardingMessage.PENDING_SHARE_ACCESS) spotlight.setPendingShareAccess(true);
        else if (messageType) spotlight.setOnboardingMessage(definitions[messageType] ?? null);
    }, []);

    return (
        <Switch>
            <Route path={getLocalPath('monitor')}>
                {(subRoute) => (
                    <CoreHeader className="border-bottom h-auto p-2">
                        <div className="flex items-center gap-2">
                            {hamburger}
                            <MonitorHeader {...subRoute} />
                        </div>
                    </CoreHeader>
                )}
            </Route>

            <Route path={getLocalPath('settings')}>
                <CoreHeader className="border-bottom h-auto p-2">
                    <div className="flex items-center gap-2">
                        {hamburger}
                        <Button
                            className="shrink-0"
                            size="small"
                            icon
                            pill
                            shape="solid"
                            onClick={() => navigate(getLocalPath())}
                        >
                            <Icon
                                className="modal-close-icon"
                                name="arrow-left"
                                size={3.5}
                                alt={c('Action').t`Close`}
                            />
                        </Button>
                        <h5 className="text-bold">{c('Title').t`Settings`}</h5>
                    </div>
                </CoreHeader>
            </Route>

            <Route>
                <>
                    <CoreHeader className="border-bottom h-auto p-2">
                        <div className="flex items-center gap-x-2 w-full">
                            {hamburger}
                            <SearchBar initial={filters.search} disabled={matchOnboarding} />
                            <ItemQuickActions onCreate={onCreate} />
                            {!matchOnboarding && <Spotlight />}
                        </div>
                    </CoreHeader>
                    {!matchOnboarding && <PinnedItemsBar />}
                </>
            </Route>
        </Switch>
    );
};
