import { c } from 'ttag';

import { useIsInboxElectronApp } from '../..';
import { Info } from '../../components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../account';
import { UnreadFaviconCounterToggle } from './UnreadFaviconCounterToggle';

export const UnreadFaviconCounter = () => {
    const { isElectron } = useIsInboxElectronApp();

    const label = isElectron
        ? c('Label').t`Show unread count in application icon`
        : c('Label').t`Show unread count in Favicon`;

    const info = isElectron
        ? c('Tooltip').t`See number of unread messages in the application icon`
        : c('Tooltip').t`See number of unread messages in the tab icon`;

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="unreadFaviconCounterToggle">
                    <span className="text-semibold mr-2">{label}</span>
                    <Info title={info} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <UnreadFaviconCounterToggle className="mr-4" id="unreadFaviconCounterToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
