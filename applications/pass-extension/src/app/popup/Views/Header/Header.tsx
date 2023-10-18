import { type VFC } from 'react';

import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useOnboardingMessage } from 'proton-pass-extension/lib/hooks/useOnboardingMessage';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import { Header as HeaderComponent } from '@proton/components';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';

import { MenuDropdown } from './MenuDropdown';
import { QuickActionsDropdown } from './QuickActionsDropdown';
import { Searchbar } from './Searchbar';

export const Header: VFC = () => {
    const { ready, context } = usePopupContext();
    const { search, setSearch } = useItemsFilteringContext();
    const onboarding = useOnboardingMessage();

    return (
        <>
            <HeaderComponent className="border-bottom h-auto p-2">
                <div className="flex flex-align-items-center gap-x-2 w-full">
                    <MenuDropdown />
                    <Searchbar disabled={!ready} value={search} handleValue={setSearch} />
                    <QuickActionsDropdown parsedUrl={context?.url} />

                    <div className="flex-item-fluid-auto w-full">
                        <Spotlight {...onboarding} />
                    </div>
                </div>
            </HeaderComponent>
        </>
    );
};
