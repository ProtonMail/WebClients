import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';

import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../account';
import { UnreadFaviconCounterToggle } from './UnreadFaviconCounterToggle';

export const UnreadFaviconCounter = () => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="unreadFaviconCounterToggle">
                    <span className="text-semibold mr-2">{c('Label').t`Show unread count in Favicon`}</span>
                    <Info title={c('Tooltip').t`See number of unread messages in the tab icon`} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <UnreadFaviconCounterToggle className="mr-4" id="unreadFaviconCounterToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
