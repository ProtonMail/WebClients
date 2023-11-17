import { type FC, type ReactElement, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Header as CoreHeader } from '@proton/components';
import { Icon } from '@proton/components/components';
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

export const Header: FC<Props> = ({ hamburger }) => {
    const { filters, setFilters, navigate, matchSettings } = useNavigation();
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
            <div className="flex items-center gap-x-2 w-full">
                {hamburger}
                {(() => {
                    if (matchSettings) {
                        return (
                            <div className="flex items-center gap-2">
                                <Button
                                    className="flex-item-noshrink"
                                    size="small"
                                    icon
                                    pill
                                    shape="solid"
                                    onClick={() => navigate(getLocalPath(), { mode: 'push' })}
                                >
                                    <Icon
                                        className="modal-close-icon"
                                        name="arrow-left"
                                        size={14}
                                        alt={c('Action').t`Close`}
                                    />
                                </Button>
                                <h5 className="text-bold">{c('Title').t`Settings`}</h5>
                            </div>
                        );
                    }

                    return (
                        <>
                            <SearchBar filters={filters} onChange={(search) => setFilters({ search })} />
                            <ItemQuickActions onCreate={onCreate} />
                        </>
                    );
                })()}

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
